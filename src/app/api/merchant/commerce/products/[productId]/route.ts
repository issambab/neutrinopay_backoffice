import { NextResponse } from "next/server";

import { deleteMerchantProduct, updateMerchantProduct } from "@/lib/commerce/commerce.server";
import type { UpdateProductRequest } from "@/lib/commerce/commerce.types";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { productId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateProductRequest;

  try {
    const product = await updateMerchantProduct(productId, body);
    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update product." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { productId } = await context.params;

  try {
    await deleteMerchantProduct(productId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete product." },
      { status: 400 },
    );
  }
}
