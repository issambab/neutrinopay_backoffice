import { NextResponse } from "next/server";

import { createAgentPayout } from "@/lib/cash/cash.server";
import type { CreateAgentPayoutRequest } from "@/lib/cash/cash.types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateAgentPayoutRequest;

  try {
    const payout = await createAgentPayout(body);
    return NextResponse.json({ payout }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create agent payout." },
      { status: 400 },
    );
  }
}
