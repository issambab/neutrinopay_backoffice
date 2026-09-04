import { NextResponse } from "next/server";

import { getAgentPayoutEarningsBalance } from "@/lib/cash/cash.server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentContractId = searchParams.get("agentContractId")?.trim();

  if (!agentContractId) {
    return NextResponse.json({ message: "Agent contract id is required." }, { status: 400 });
  }

  try {
    const balance = await getAgentPayoutEarningsBalance(agentContractId);
    return NextResponse.json({ balance });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load agent payout earnings balance." },
      { status: 400 },
    );
  }
}
