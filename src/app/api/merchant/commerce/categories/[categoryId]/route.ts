import { NextResponse } from "next/server";

import { deleteMerchantProductCategory, updateMerchantProductCategory } from "@/lib/commerce/commerce.server";
import type { UpdateProductCategoryRequest } from "@/lib/commerce/commerce.types";

type RouteContext = {
  params: Promise<{ categoryId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { categoryId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateProductCategoryRequest;

  try {
    const category = await updateMerchantProductCategory(categoryId, body);
    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update product category." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { categoryId } = await context.params;

  try {
    await deleteMerchantProductCategory(categoryId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete product category." },
      { status: 400 },
    );
  }
}
