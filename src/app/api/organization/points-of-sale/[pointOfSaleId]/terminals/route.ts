import { NextResponse } from "next/server";

import { createTerminal } from "@/lib/organization/organization.server";
import type { CreateTerminalRequest } from "@/lib/organization/organization.types";

type RouteContext = {
  params: Promise<{ pointOfSaleId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { pointOfSaleId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as CreateTerminalRequest;

  try {
    const terminal = await createTerminal(pointOfSaleId, body);
    return NextResponse.json({ terminal }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create terminal." },
      { status: 400 },
    );
  }
}
