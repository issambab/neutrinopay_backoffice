import { NextResponse } from "next/server";

import { getAdminWalletBalance } from "@/lib/wallet/wallet.server";

type WalletBalanceRouteProps = {
  params: Promise<{
    walletId: string;
  }>;
};

export async function GET(_request: Request, { params }: WalletBalanceRouteProps) {
  try {
    const { walletId } = await params;
    const balance = await getAdminWalletBalance(walletId);
    return NextResponse.json({ balance });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load wallet balance." },
      { status: 400 },
    );
  }
}
