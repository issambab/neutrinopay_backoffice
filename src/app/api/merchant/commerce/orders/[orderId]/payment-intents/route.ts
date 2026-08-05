import { NextResponse } from "next/server";

import { listMerchantOrderPaymentIntents } from "@/lib/commerce/commerce.server";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  try {
    const paymentIntents = await listMerchantOrderPaymentIntents(orderId);
    return NextResponse.json({ paymentIntents });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load merchant payment intents." },
      { status: 400 },
    );
  }
}
