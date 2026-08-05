import { NextResponse } from "next/server";

import { changeBusinessStatus } from "@/lib/organization/organization.server";
import type { UpdateStatusRequest } from "@/lib/organization/organization.types";

type RouteContext = {
  params: Promise<{ businessId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { businessId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateStatusRequest;

  try {
    const business = await changeBusinessStatus(businessId, body);
    return NextResponse.json({ business });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update merchant status." },
      { status: 400 },
    );
  }
}
