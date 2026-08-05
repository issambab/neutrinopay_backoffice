import { NextResponse } from "next/server";

import { exportMerchantSalesCsv } from "@/lib/commerce/commerce.server";

export async function GET(request: Request) {
  try {
    const filters = Object.fromEntries(new URL(request.url).searchParams.entries());
    const file = await exportMerchantSalesCsv(filters);
    return new Response(file.body, {
      headers: {
        ...(file.contentDisposition ? { "content-disposition": file.contentDisposition } : {}),
        ...(file.contentLength ? { "content-length": file.contentLength } : {}),
        "content-type": file.contentType,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to export sales." },
      { status: 400 },
    );
  }
}
