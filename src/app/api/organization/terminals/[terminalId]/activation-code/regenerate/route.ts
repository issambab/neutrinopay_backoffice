import { NextResponse } from "next/server";

import { regenerateTerminalActivationCode } from "@/lib/organization/organization.server";

type RouteContext = {
  params: Promise<{ terminalId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { terminalId } = await context.params;

  try {
    const terminal = await regenerateTerminalActivationCode(terminalId);
    return NextResponse.json({ terminal });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to regenerate terminal activation code." },
      { status: 400 },
    );
  }
}
