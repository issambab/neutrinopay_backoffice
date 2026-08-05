import { NextResponse } from "next/server";

import { getPostLoginRedirect, persistAuthSession, verifyMfaToBackend } from "@/lib/auth/auth.server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { challengeId?: string; code?: string };

  if (!body.challengeId || !body.code) {
    return NextResponse.json({ message: "Challenge MFA et code requis." }, { status: 400 });
  }

  try {
    const auth = await verifyMfaToBackend({
      challengeId: body.challengeId,
      code: body.code,
      deviceFingerprint: request.headers.get("user-agent") ?? "backoffice-web",
    });
    await persistAuthSession(auth);

    return NextResponse.json({
      redirectTo: getPostLoginRedirect(auth.authorities, auth.passwordChangeRequired),
      user: {
        authorities: auth.authorities,
        id: auth.userId,
        tenantId: auth.tenantId,
        username: auth.username,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Verification MFA echouee." },
      { status: 401 },
    );
  }
}
