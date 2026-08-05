import { NextResponse } from "next/server";

import { fetchPublicProductImageFile } from "@/lib/commerce/commerce-public.server";

type RouteContext = {
  params: Promise<{ imageId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { imageId } = await context.params;

  try {
    const file = await fetchPublicProductImageFile(imageId);
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
