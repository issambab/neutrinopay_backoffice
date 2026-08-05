import { NextResponse } from "next/server";

import { registerCustomerAccount } from "@/lib/auth/auth.server";
import type { RegisterAccountRequest } from "@/lib/auth/auth.types";

type RegisterBody = RegisterAccountRequest & {
  acceptTerms?: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RegisterBody;

  if (!body.acceptTerms) {
    return NextResponse.json({ message: "Vous devez accepter les conditions." }, { status: 400 });
  }

  try {
    const user = await registerCustomerAccount({
      email: body.email,
      externalReference: body.externalReference ?? null,
      fullName: body.fullName,
      metadata: { source: "backoffice_register" },
      password: body.password,
      phoneNumber: body.phoneNumber ?? null,
    });
    return NextResponse.json({ user, verifyEmail: body.email }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Impossible de creer le compte." },
      { status: 400 },
    );
  }
}
