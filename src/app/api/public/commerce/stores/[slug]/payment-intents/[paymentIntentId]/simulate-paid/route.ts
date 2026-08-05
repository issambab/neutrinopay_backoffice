import { NextResponse } from "next/server";

import { simulatePublicStorePaymentPaid } from "@/lib/commerce/commerce-public.server";

type RouteContext = {
  params: Promise<{ paymentIntentId: string; slug: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { paymentIntentId, slug } = await context.params;

  try {
    const paymentIntent = await simulatePublicStorePaymentPaid(slug, paymentIntentId);
    return NextResponse.json({ paymentIntent });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to confirm simulated payment." },
      { status: 400 },
    );
  }
}
