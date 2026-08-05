import { NextResponse } from "next/server";

import { fetchMerchantProductImageFile } from "@/lib/commerce/commerce.server";

type RouteContext = {
  params: Promise<{ imageId: string; productId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { imageId, productId } = await context.params;

  try {
    const file = await fetchMerchantProductImageFile(productId, imageId);
    return new Response(file.body, {
      headers: {
        ...(file.contentDisposition ? { "content-disposition": file.contentDisposition } : {}),
        ...(file.contentLength ? { "content-length": file.contentLength } : {}),
        "content-type": file.contentType,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load product image." },
      { status: 404 },
    );
  }
}
