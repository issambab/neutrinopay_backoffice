import { NextResponse } from "next/server";

import type { CreateCommercePaymentIntentRequest } from "@/lib/commerce/commerce.types";
import { createPublicStoreOrderPaymentIntent } from "@/lib/commerce/commerce-public.server";

type RouteContext = {
  params: Promise<{ orderId: string; slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { orderId, slug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as CreateCommercePaymentIntentRequest;

  try {
    const paymentIntent = await createPublicStoreOrderPaymentIntent(slug, orderId, body);
    return NextResponse.json({ paymentIntent }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create commerce payment intent." },
      { status: 400 },
    );
  }
}
