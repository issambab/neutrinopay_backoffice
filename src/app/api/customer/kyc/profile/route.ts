import { NextResponse } from "next/server";

import { createCustomerKycProfile } from "@/lib/kyc/kyc.server";
import type { CreateCustomerKycProfileRequest } from "@/lib/kyc/kyc.types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateCustomerKycProfileRequest;

  try {
    const profile = await createCustomerKycProfile(body);
    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create customer KYC profile." },
      { status: 400 },
    );
  }
}
