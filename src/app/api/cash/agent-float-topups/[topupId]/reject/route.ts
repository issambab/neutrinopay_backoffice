import { NextResponse } from "next/server";

import { rejectAgentFloatTopup } from "@/lib/cash/cash.server";
import type { RejectAgentFloatTopupRequest } from "@/lib/cash/cash.types";

type RouteContext = {
  params: Promise<{
    topupId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { topupId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as RejectAgentFloatTopupRequest;

  try {
    const topup = await rejectAgentFloatTopup(topupId, body);
    return NextResponse.json({ topup });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to reject agent float top-up." },
      { status: 400 },
    );
  }
}
