import { NextResponse } from "next/server";

import { executeAgentCashOperation } from "@/lib/cash/cash.server";
import type { ExecuteCashOperationRequest } from "@/lib/cash/cash.types";

type RouteContext = {
  params: Promise<{
    operationId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { operationId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as ExecuteCashOperationRequest;

  try {
    const operation = await executeAgentCashOperation(operationId, body);
    return NextResponse.json({ operation });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to execute cash operation." },
      { status: 400 },
    );
  }
}
