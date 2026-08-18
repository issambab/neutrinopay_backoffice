import { NextResponse } from "next/server";

import { changeAgencyStatus } from "@/lib/cash/cash.server";
import type { UpdateAgencyStatusRequest } from "@/lib/cash/cash.types";

type RouteContext = {
  params: Promise<{
    agencyId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { agencyId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateAgencyStatusRequest;

  try {
    const agency = await changeAgencyStatus(agencyId, body);
    return NextResponse.json({ agency });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update agency status." },
      { status: 400 },
    );
  }
}
