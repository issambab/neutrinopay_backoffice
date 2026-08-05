import { NextResponse } from "next/server";

import { deletePointOfSale, updatePointOfSale } from "@/lib/organization/organization.server";
import type { UpdatePointOfSaleRequest } from "@/lib/organization/organization.types";

type RouteContext = {
  params: Promise<{ pointOfSaleId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { pointOfSaleId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdatePointOfSaleRequest;

  try {
    const pointOfSale = await updatePointOfSale(pointOfSaleId, body);
    return NextResponse.json({ pointOfSale });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update point of sale." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { pointOfSaleId } = await context.params;

  try {
    await deletePointOfSale(pointOfSaleId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete point of sale." },
      { status: 400 },
    );
  }
}
