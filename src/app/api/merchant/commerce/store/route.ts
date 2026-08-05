import { NextResponse } from "next/server";

import { createMerchantCommerceStore, updateMerchantCommerceStore } from "@/lib/commerce/commerce.server";
import type { CreateCommerceStoreRequest, UpdateCommerceStoreRequest } from "@/lib/commerce/commerce.types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateCommerceStoreRequest;

  try {
    const store = await createMerchantCommerceStore(body);
    return NextResponse.json({ store }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create merchant store." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as UpdateCommerceStoreRequest;

  try {
    const store = await updateMerchantCommerceStore(body);
    return NextResponse.json({ store });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update merchant store." },
      { status: 400 },
    );
  }
}
