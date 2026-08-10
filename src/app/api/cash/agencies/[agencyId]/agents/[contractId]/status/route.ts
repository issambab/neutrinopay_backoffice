import { NextResponse } from "next/server";

import { changeAgencyAgentStatus } from "@/lib/cash/cash.server";
import type { UpdateCashAgentContractStatusRequest } from "@/lib/cash/cash.types";

type RouteContext = {
  params: Promise<{
    agencyId: string;
    contractId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { agencyId, contractId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateCashAgentContractStatusRequest;

  try {
    const contract = await changeAgencyAgentStatus(agencyId, contractId, body);
    return NextResponse.json({ contract });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update cash agent contract." },
      { status: 400 },
    );
  }
}
