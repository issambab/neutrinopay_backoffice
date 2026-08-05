import { NextResponse } from "next/server";

import type { LookupCommerceOrderRequest } from "@/lib/commerce/commerce.types";
import { lookupPublicStoreOrder } from "@/lib/commerce/commerce-public.server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as LookupCommerceOrderRequest;

  try {
    const order = await lookupPublicStoreOrder(slug, body);
    if (!order) {
      return NextResponse.json({ message: "Commande introuvable." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to lookup commerce order." },
      { status: 400 },
    );
  }
}
