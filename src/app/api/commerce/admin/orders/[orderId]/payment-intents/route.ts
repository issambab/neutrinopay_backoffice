import { NextResponse } from "next/server";

import { listAdminOrderPaymentIntents } from "@/lib/commerce/commerce.server";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  try {
    const paymentIntents = await listAdminOrderPaymentIntents(orderId);
    return NextResponse.json({ paymentIntents });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load commerce payment intents." },
      { status: 400 },
    );
  }
}
