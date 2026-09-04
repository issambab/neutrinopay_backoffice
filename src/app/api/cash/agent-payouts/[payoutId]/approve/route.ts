import { NextResponse } from "next/server";

import { approveAgentPayout } from "@/lib/cash/cash.server";
import type { ApproveAgentPayoutRequest } from "@/lib/cash/cash.types";

type RouteContext = {
  params: Promise<{
    payoutId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { payoutId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as ApproveAgentPayoutRequest;

  try {
    const payout = await approveAgentPayout(payoutId, body);
    return NextResponse.json({ payout });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to approve agent payout." },
      { status: 400 },
    );
  }
}
