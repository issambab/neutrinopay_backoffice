import { NextResponse } from "next/server";

import { createMerchantProductCategory } from "@/lib/commerce/commerce.server";
import type { CreateProductCategoryRequest } from "@/lib/commerce/commerce.types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateProductCategoryRequest;

  try {
    const category = await createMerchantProductCategory(body);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create product category." },
      { status: 400 },
    );
  }
}
