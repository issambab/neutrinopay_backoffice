import { NextResponse } from "next/server";

import { createAgency } from "@/lib/cash/cash.server";
import type { CreateAgencyRequest } from "@/lib/cash/cash.types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateAgencyRequest;

  try {
    const agency = await createAgency(body);
    return NextResponse.json({ agency }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create agency." },
      { status: 400 },
    );
  }
}
