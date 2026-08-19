import { NextResponse } from "next/server";

import { rejectAgentSettlement } from "@/lib/cash/cash.server";
import type { RejectAgentSettlementRequest } from "@/lib/cash/cash.types";

type RouteContext = {
  params: Promise<{
    settlementId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { settlementId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as RejectAgentSettlementRequest;

  try {
    const settlement = await rejectAgentSettlement(settlementId, body);
    return NextResponse.json({ settlement });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to reject agent settlement." },
      { status: 400 },
    );
  }
}
