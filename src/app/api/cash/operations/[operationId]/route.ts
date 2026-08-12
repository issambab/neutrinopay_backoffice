import { NextResponse } from "next/server";

import { getCashOperation } from "@/lib/cash/cash.server";

type CashOperationRouteProps = {
  params: Promise<{
    operationId: string;
  }>;
};

export async function GET(_request: Request, { params }: CashOperationRouteProps) {
  try {
    const { operationId } = await params;
    const operation = await getCashOperation(operationId);
    return NextResponse.json({ operation });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load cash operation." },
      { status: 400 },
    );
  }
}
