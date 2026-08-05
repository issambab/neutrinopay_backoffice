import { NextResponse } from "next/server";

import { resendMfaChallenge } from "@/lib/auth/auth.server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { challengeId?: string };

  if (!body.challengeId) {
    return NextResponse.json({ message: "Challenge MFA requis." }, { status: 400 });
  }

  try {
    const challenge = await resendMfaChallenge(body.challengeId);
    return NextResponse.json({ challenge });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Impossible d'envoyer le code MFA." },
      { status: 400 },
    );
  }
}
