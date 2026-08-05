import { NextResponse } from "next/server";

import { reviewKycDocument } from "@/lib/kyc/kyc.server";
import type { ReviewKycDocumentRequest } from "@/lib/kyc/kyc.types";

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { documentId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as ReviewKycDocumentRequest;

  try {
    const document = await reviewKycDocument(documentId, body);
    return NextResponse.json({ document });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to review KYC document." },
      { status: 400 },
    );
  }
}
