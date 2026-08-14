import { NextResponse } from "next/server";

import { approveAgentFloatTopup } from "@/lib/cash/cash.server";
import type { ApproveAgentFloatTopupRequest } from "@/lib/cash/cash.types";

type RouteContext = {
  params: Promise<{
    topupId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { topupId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as ApproveAgentFloatTopupRequest;

  try {
    const topup = await approveAgentFloatTopup(topupId, body);
    return NextResponse.json({ topup });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to approve agent float top-up." },
      { status: 400 },
    );
  }
}
