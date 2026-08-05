import { NextResponse } from "next/server";

import { changeAdminPaymentIntentStatus } from "@/lib/commerce/commerce.server";
import type { UpdateCommercePaymentIntentStatusRequest } from "@/lib/commerce/commerce.types";

type RouteContext = {
  params: Promise<{ paymentIntentId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { paymentIntentId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateCommercePaymentIntentStatusRequest;

  try {
    const paymentIntent = await changeAdminPaymentIntentStatus(paymentIntentId, body);
    return NextResponse.json({ paymentIntent });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update commerce payment intent status." },
      { status: 400 },
    );
  }
}
