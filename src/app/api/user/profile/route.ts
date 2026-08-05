import { NextResponse } from "next/server";

import { updateCurrentUserProfile } from "@/lib/auth/auth.server";

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    fullName?: string | null;
    phoneNumber?: string | null;
  };

  try {
    const user = await updateCurrentUserProfile({
      fullName: body.fullName ?? null,
      phoneNumber: body.phoneNumber ?? null,
    });
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Impossible de mettre a jour le profil." },
      { status: 400 },
    );
  }
}
