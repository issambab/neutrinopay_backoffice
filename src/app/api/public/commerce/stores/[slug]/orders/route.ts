import { NextResponse } from "next/server";

import type { CreateCommerceOrderRequest } from "@/lib/commerce/commerce.types";
import { createPublicStoreOrder } from "@/lib/commerce/commerce-public.server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as CreateCommerceOrderRequest;

  try {
    const order = await createPublicStoreOrder(slug, body);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create commerce order." },
      { status: 400 },
    );
  }
}
