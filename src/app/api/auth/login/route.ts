import { NextResponse } from "next/server";

import { getPostLoginRedirect, loginToBackend, persistAuthSession } from "@/lib/auth/auth.server";

type LoginBody = {
  identifier?: string;
  password?: string;
  remember?: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LoginBody;

  if (!body.identifier || !body.password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  try {
    const auth = await loginToBackend({
      identifier: body.identifier,
      password: body.password,
      deviceFingerprint: request.headers.get("user-agent") ?? "backoffice-web",
    });

    if (auth.mfaRequired) {
      return NextResponse.json({
        mfaRequired: true,
        challengeId: auth.mfaChallengeId,
        username: auth.username,
      });
    }

    await persistAuthSession(auth);

    return NextResponse.json({
      redirectTo: getPostLoginRedirect(auth.authorities, auth.passwordChangeRequired),
      user: {
        id: auth.userId,
        username: auth.username,
        tenantId: auth.tenantId,
        authorities: auth.authorities,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Authentication failed.",
      },
      { status: 401 },
    );
  }
}
