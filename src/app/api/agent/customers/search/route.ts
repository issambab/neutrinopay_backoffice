import { NextResponse } from "next/server";

import { searchAgentCashCustomer } from "@/lib/cash/cash.server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  try {
    const customer = await searchAgentCashCustomer(query);
    return NextResponse.json({ customer });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to search cash customer." },
      { status: 400 },
    );
  }
}
