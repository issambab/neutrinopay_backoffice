import { NextResponse } from "next/server";

import { createMerchantKycProfile } from "@/lib/kyc/kyc.server";
import type { CreateMerchantKycProfileRequest } from "@/lib/kyc/kyc.types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateMerchantKycProfileRequest;

  try {
    const profile = await createMerchantKycProfile(body);
    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create merchant KYC profile." },
      { status: 400 },
    );
  }
}
