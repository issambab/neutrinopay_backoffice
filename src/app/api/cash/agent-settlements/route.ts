import { NextResponse } from "next/server";

import { createAgentSettlement } from "@/lib/cash/cash.server";
import type { CreateAgentSettlementRequest } from "@/lib/cash/cash.types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateAgentSettlementRequest;

  try {
    const settlement = await createAgentSettlement(body);
    return NextResponse.json({ settlement }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create agent settlement." },
      { status: 400 },
    );
  }
}
