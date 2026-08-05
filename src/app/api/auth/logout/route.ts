import { NextResponse } from "next/server";

import { clearAuthSession, logoutFromBackend } from "@/lib/auth/auth.server";

export async function POST() {
  await logoutFromBackend();
  await clearAuthSession();

  return NextResponse.json({ success: true });
}
