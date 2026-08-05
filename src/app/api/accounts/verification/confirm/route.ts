import { NextResponse } from "next/server";

import { confirmAccountVerification } from "@/lib/auth/auth.server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { code?: string; identifier?: string };

  if (!body.identifier || !body.code) {
    return NextResponse.json({ message: "Email et code requis." }, { status: 400 });
  }

  try {
    await confirmAccountVerification(body.identifier, body.code);
    return NextResponse.json({ verified: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Impossible de verifier le compte." },
      { status: 400 },
    );
  }
}
