import { NextResponse } from "next/server";

import { createKycProfile } from "@/lib/kyc/kyc.server";
import type { CreateKycProfileRequest } from "@/lib/kyc/kyc.types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateKycProfileRequest;

  try {
    const profile = await createKycProfile(body);
    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create KYC profile." },
      { status: 400 },
    );
  }
}
