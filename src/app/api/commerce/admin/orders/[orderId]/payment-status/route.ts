import { NextResponse } from "next/server";

import { changeAdminCommerceOrderPaymentStatus } from "@/lib/commerce/commerce.server";
import type { UpdateCommerceOrderPaymentStatusRequest } from "@/lib/commerce/commerce.types";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateCommerceOrderPaymentStatusRequest;

  try {
    const order = await changeAdminCommerceOrderPaymentStatus(orderId, body);
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update commerce order payment status." },
      { status: 400 },
    );
  }
}
