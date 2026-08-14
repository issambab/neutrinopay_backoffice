import { NextResponse } from "next/server";

import { confirmAgentCashOperation } from "@/lib/cash/cash.server";
import type { ConfirmCashOperationRequest } from "@/lib/cash/cash.types";

type RouteContext = {
  params: Promise<{
    operationId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { operationId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as ConfirmCashOperationRequest;

  try {
    const operation = await confirmAgentCashOperation(operationId, body);
    return NextResponse.json({ operation });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to confirm cash operation." },
      { status: 400 },
    );
  }
}
