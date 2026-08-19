import { NextResponse } from "next/server";

import { approveAgentSettlement } from "@/lib/cash/cash.server";
import type { ApproveAgentSettlementRequest } from "@/lib/cash/cash.types";

type RouteContext = {
  params: Promise<{
    settlementId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { settlementId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as ApproveAgentSettlementRequest;

  try {
    const settlement = await approveAgentSettlement(settlementId, body);
    return NextResponse.json({ settlement });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to approve agent settlement." },
      { status: 400 },
    );
  }
}
