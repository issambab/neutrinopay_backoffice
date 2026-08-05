import { NextResponse } from "next/server";

import { uploadMerchantKycDocument } from "@/lib/kyc/kyc.server";

export async function POST(request: Request) {
  const formData = await request.formData();

  try {
    const document = await uploadMerchantKycDocument(formData);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to upload merchant KYC document." },
      { status: 400 },
    );
  }
}
