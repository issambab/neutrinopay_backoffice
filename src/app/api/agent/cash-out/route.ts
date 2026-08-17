import { NextResponse } from "next/server";

import { startAgentCashOut } from "@/lib/cash/cash.server";
import type { StartCashOperationRequest } from "@/lib/cash/cash.types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as StartCashOperationRequest;

  try {
    const operation = await startAgentCashOut(body);
    return NextResponse.json({ operation }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to start cash-out." },
      { status: 400 },
    );
  }
}
