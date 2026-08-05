import { NextResponse } from "next/server";

import { changeBackendPassword, getPostLoginRedirect, getSessionUser } from "@/lib/auth/auth.server";
import type { ChangePasswordRequest } from "@/lib/auth/auth.types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ChangePasswordRequest;

  if (!body.currentPassword || !body.newPassword) {
    return NextResponse.json({ message: "Current password and new password are required." }, { status: 400 });
  }

  try {
    await changeBackendPassword(body);
    const sessionUser = await getSessionUser();

    return NextResponse.json({
      redirectTo: getPostLoginRedirect(sessionUser?.authorities ?? [], false),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to change password." },
      { status: 400 },
    );
  }
}
