import { NextResponse } from "next/server";

import { changeTerminalStatus } from "@/lib/organization/organization.server";
import type { UpdateStatusRequest } from "@/lib/organization/organization.types";

type RouteContext = {
  params: Promise<{ terminalId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { terminalId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateStatusRequest;

  try {
    const terminal = await changeTerminalStatus(terminalId, body);
    return NextResponse.json({ terminal });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update terminal status." },
      { status: 400 },
    );
  }
}
