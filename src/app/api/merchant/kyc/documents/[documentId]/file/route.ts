import { NextResponse } from "next/server";

import { fetchMerchantKycDocumentFile } from "@/lib/kyc/kyc.server";

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { documentId } = await context.params;

  try {
    const file = await fetchMerchantKycDocumentFile(documentId);
    return new NextResponse(file.body, {
      headers: responseHeaders(file),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load merchant KYC document file." },
      { status: 400 },
    );
  }
}

function responseHeaders(file: {
  contentDisposition: string | null;
  contentLength: string | null;
  contentType: string;
}) {
  const headers = new Headers();
  headers.set("Content-Type", file.contentType);
  if (file.contentDisposition) {
    headers.set("Content-Disposition", file.contentDisposition);
  }
  if (file.contentLength) {
    headers.set("Content-Length", file.contentLength);
  }
  return headers;
}
