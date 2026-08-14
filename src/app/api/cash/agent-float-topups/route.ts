import { NextResponse } from "next/server";

import { createAgentFloatTopup } from "@/lib/cash/cash.server";
import type { CreateAgentFloatTopupRequest } from "@/lib/cash/cash.types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateAgentFloatTopupRequest;

  try {
    const topup = await createAgentFloatTopup(body);
    return NextResponse.json({ topup }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create agent float top-up." },
      { status: 400 },
    );
  }
}
