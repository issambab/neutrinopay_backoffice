import { NextResponse } from "next/server";

import { updateAdminProduct } from "@/lib/commerce/commerce.server";
import type { UpdateProductRequest } from "@/lib/commerce/commerce.types";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { productId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateProductRequest;

  try {
    const product = await updateAdminProduct(productId, body);
    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update product." },
      { status: 400 },
    );
  }
}
