import { NextResponse } from "next/server";

import { updateAgencyAgentContract } from "@/lib/cash/cash.server";
import type { UpdateCashAgentContractRequest } from "@/lib/cash/cash.types";

type RouteContext = {
  params: Promise<{
    agencyId: string;
    contractId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { agencyId, contractId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateCashAgentContractRequest;

  try {
    const contract = await updateAgencyAgentContract(agencyId, contractId, body);
    return NextResponse.json({ contract });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update cash agent contract." },
      { status: 400 },
    );
  }
}
