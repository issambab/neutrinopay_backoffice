import { NextResponse } from "next/server";

import { updateAgency } from "@/lib/cash/cash.server";
import type { UpdateAgencyRequest } from "@/lib/cash/cash.types";

type RouteContext = {
  params: Promise<{
    agencyId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { agencyId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateAgencyRequest;

  try {
    const agency = await updateAgency(agencyId, body);
    return NextResponse.json({ agency });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update agency." },
      { status: 400 },
    );
  }
}
