import { NextResponse } from "next/server";

import { deleteTerminal, updateTerminal } from "@/lib/organization/organization.server";
import type { UpdateTerminalRequest } from "@/lib/organization/organization.types";

type RouteContext = {
  params: Promise<{ terminalId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { terminalId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateTerminalRequest;

  try {
    const terminal = await updateTerminal(terminalId, body);
    return NextResponse.json({ terminal });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update terminal." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { terminalId } = await context.params;

  try {
    await deleteTerminal(terminalId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete terminal." },
      { status: 400 },
    );
  }
}
