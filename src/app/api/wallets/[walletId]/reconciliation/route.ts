import { NextResponse } from "next/server";

import { getAdminWalletReconciliation } from "@/lib/wallet/wallet.server";

type WalletReconciliationRouteProps = {
  params: Promise<{
    walletId: string;
  }>;
};

export async function GET(_request: Request, { params }: WalletReconciliationRouteProps) {
  try {
    const { walletId } = await params;
    const reconciliation = await getAdminWalletReconciliation(walletId);
    return NextResponse.json({ reconciliation });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load wallet reconciliation." },
      { status: 400 },
    );
  }
}
