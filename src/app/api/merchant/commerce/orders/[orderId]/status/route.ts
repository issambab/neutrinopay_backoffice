import { NextResponse } from "next/server";

import { changeMerchantOrderStatus } from "@/lib/commerce/commerce.server";
import type { UpdateCommerceOrderStatusRequest } from "@/lib/commerce/commerce.types";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateCommerceOrderStatusRequest;

  try {
    const order = await changeMerchantOrderStatus(orderId, body);
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update merchant order status." },
      { status: 400 },
    );
  }
}
