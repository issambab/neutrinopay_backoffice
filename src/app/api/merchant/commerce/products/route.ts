import { NextResponse } from "next/server";

import { createMerchantProduct } from "@/lib/commerce/commerce.server";
import type { CreateProductRequest } from "@/lib/commerce/commerce.types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateProductRequest;

  try {
    const product = await createMerchantProduct(body);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create product." },
      { status: 400 },
    );
  }
}
