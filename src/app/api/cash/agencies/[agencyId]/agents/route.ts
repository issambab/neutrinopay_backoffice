import { NextResponse } from "next/server";

import { assignAgencyAgent } from "@/lib/cash/cash.server";
import type { CreateCashAgentContractRequest } from "@/lib/cash/cash.types";

type RouteContext = {
  params: Promise<{
    agencyId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { agencyId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as CreateCashAgentContractRequest;

  try {
    const contract = await assignAgencyAgent(agencyId, body);
    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to assign cash agent." },
      { status: 400 },
    );
  }
}
