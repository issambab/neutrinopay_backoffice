import { NextResponse } from "next/server";

import { changePointOfSaleStatus } from "@/lib/organization/organization.server";
import type { UpdateStatusRequest } from "@/lib/organization/organization.types";

type RouteContext = {
  params: Promise<{ pointOfSaleId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { pointOfSaleId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateStatusRequest;

  try {
    const pointOfSale = await changePointOfSaleStatus(pointOfSaleId, body);
    return NextResponse.json({ pointOfSale });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update point of sale status." },
      { status: 400 },
    );
  }
}
