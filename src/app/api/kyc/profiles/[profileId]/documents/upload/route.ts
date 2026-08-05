import { NextResponse } from "next/server";

import { uploadKycDocument } from "@/lib/kyc/kyc.server";

type RouteContext = {
  params: Promise<{ profileId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { profileId } = await context.params;
  const formData = await request.formData();

  try {
    const document = await uploadKycDocument(profileId, formData);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to upload KYC document." },
      { status: 400 },
    );
  }
}
