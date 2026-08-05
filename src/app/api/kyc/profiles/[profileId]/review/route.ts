import { NextResponse } from "next/server";

import { reviewKycProfile } from "@/lib/kyc/kyc.server";
import type { ReviewKycProfileRequest } from "@/lib/kyc/kyc.types";

type RouteContext = {
  params: Promise<{ profileId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { profileId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as ReviewKycProfileRequest;

  try {
    const profile = await reviewKycProfile(profileId, body);
    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to review KYC profile." },
      { status: 400 },
    );
  }
}
