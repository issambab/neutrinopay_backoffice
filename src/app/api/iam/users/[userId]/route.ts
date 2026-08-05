import { NextResponse } from "next/server";

import { changeUserStatus, updateUser } from "@/lib/iam/users.server";

type UpdateUserBody = {
  externalReference?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  fullName?: string | null;
  userType?: string | null;
  mfaEnabled?: boolean | null;
  metadata?: Record<string, unknown> | null;
  status?: string | null;
};

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { userId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateUserBody;

  try {
    const updatedUser = await updateUser(userId, {
      externalReference: body.externalReference,
      phoneNumber: body.phoneNumber,
      email: body.email,
      fullName: body.fullName,
      userType: body.userType,
      mfaEnabled: body.mfaEnabled,
      metadata: body.metadata,
    });

    const user =
      body.status && body.status !== updatedUser.status
        ? await changeUserStatus(userId, { status: body.status })
        : updatedUser;

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to update user.",
      },
      { status: 400 },
    );
  }
}
