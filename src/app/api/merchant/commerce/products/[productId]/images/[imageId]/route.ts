import { NextResponse } from "next/server";

import { deleteMerchantProductImage } from "@/lib/commerce/commerce.server";

type RouteContext = {
  params: Promise<{ imageId: string; productId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { imageId, productId } = await context.params;

  try {
    await deleteMerchantProductImage(productId, imageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete product image." },
      { status: 400 },
    );
  }
}
