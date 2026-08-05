import { NextResponse } from "next/server";

import { deleteBusiness, updateBusiness } from "@/lib/organization/organization.server";
import type { UpdateBusinessRequest } from "@/lib/organization/organization.types";

type RouteContext = {
  params: Promise<{ businessId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { businessId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateBusinessRequest;

  try {
    const business = await updateBusiness(businessId, body);
    return NextResponse.json({ business });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update merchant." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { businessId } = await context.params;

  try {
    await deleteBusiness(businessId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete merchant." },
      { status: 400 },
    );
  }
}
