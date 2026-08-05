import { NextResponse } from "next/server";

import { getCurrentCustomerWallet, provisionCurrentCustomerWallet } from "@/lib/wallet/wallet.server";

export async function GET() {
  try {
    const wallet = await getCurrentCustomerWallet();
    return NextResponse.json({ wallet });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load customer wallet." },
      { status: 400 },
    );
  }
}

export async function POST() {
  try {
    const wallet = await provisionCurrentCustomerWallet();
    return NextResponse.json({ wallet });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to provision customer wallet." },
      { status: 400 },
    );
  }
}
