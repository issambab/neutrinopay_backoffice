import { NextResponse } from "next/server";

import { rejectAgentPayout } from "@/lib/cash/cash.server";
import type { RejectAgentPayoutRequest } from "@/lib/cash/cash.types";

type RouteContext = {
  params: Promise<{
    payoutId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { payoutId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as RejectAgentPayoutRequest;

  try {
    const payout = await rejectAgentPayout(payoutId, body);
    return NextResponse.json({ payout });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to reject agent payout." },
      { status: 400 },
    );
  }
}
