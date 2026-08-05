import { NextResponse } from "next/server";

import { exportAdminBusinessSalesCsv } from "@/lib/commerce/commerce.server";

type RouteContext = {
  params: Promise<{ businessId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { businessId } = await context.params;

  try {
    const filters = Object.fromEntries(new URL(request.url).searchParams.entries());
    const file = await exportAdminBusinessSalesCsv(businessId, filters);
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
