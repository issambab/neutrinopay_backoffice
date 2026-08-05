import { NextResponse } from "next/server";

import { getPublicStoreOrder } from "@/lib/commerce/commerce-public.server";

type RouteContext = {
  params: Promise<{ orderId: string; slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { orderId, slug } = await context.params;

  try {
    const order = await getPublicStoreOrder(slug, orderId);
    if (!order) {
      return NextResponse.json({ message: "Commande introuvable." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load commerce order." },
      { status: 400 },
    );
  }
}
