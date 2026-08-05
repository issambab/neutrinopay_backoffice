import { NextResponse } from "next/server";

import { createPointOfSale } from "@/lib/organization/organization.server";
import type { CreatePointOfSaleRequest } from "@/lib/organization/organization.types";

type RouteContext = {
  params: Promise<{ businessId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { businessId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as CreatePointOfSaleRequest;

  try {
    const pointOfSale = await createPointOfSale(businessId, body);
    return NextResponse.json({ pointOfSale }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create point of sale." },
      { status: 400 },
    );
  }
}
