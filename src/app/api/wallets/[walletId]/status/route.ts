import { NextResponse } from "next/server";

import { changeAdminWalletStatus } from "@/lib/wallet/wallet.server";
import type { UpdateWalletStatusRequest } from "@/lib/wallet/wallet.types";

type WalletStatusRouteProps = {
  params: Promise<{
    walletId: string;
  }>;
};

export async function PATCH(request: Request, { params }: WalletStatusRouteProps) {
  try {
    const { walletId } = await params;
    const payload = (await request.json()) as UpdateWalletStatusRequest;
    const wallet = await changeAdminWalletStatus(walletId, payload);
    return NextResponse.json({ wallet });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update wallet status." },
      { status: 400 },
    );
  }
}
