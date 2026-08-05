import { NextResponse } from "next/server";

import { sendAccountVerification } from "@/lib/auth/auth.server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { identifier?: string };

  if (!body.identifier) {
    return NextResponse.json({ message: "Email requis." }, { status: 400 });
  }

  try {
    const challenge = await sendAccountVerification(body.identifier);
    return NextResponse.json({ challenge });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Impossible d'envoyer le code." },
      { status: 400 },
    );
  }
}
