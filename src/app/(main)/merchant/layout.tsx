import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { CHANGE_PASSWORD_PATH } from "@/lib/auth/auth.constants";
import { isPasswordChangeRequired } from "@/lib/auth/auth.server";
import { listMerchantOrders } from "@/lib/commerce/commerce.server";
import { requireMerchantProfile } from "@/lib/merchant/merchant.server";

import { MerchantNav } from "./_components/merchant-nav";

export default async function MerchantLayout({ children }: { children: ReactNode }) {
  if (await isPasswordChangeRequired()) {
    redirect(CHANGE_PASSWORD_PATH);
  }

  const profile = await requireMerchantProfile();
  const pendingOrders = await getPendingOrdersCount();

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[17rem_1fr]">
      <MerchantNav pendingOrders={pendingOrders} />
      <main className="min-w-0">
        <header className="flex h-14 items-center border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">Espace marchand</p>
            <p className="truncate font-medium text-sm">{profile.user.fullName ?? profile.user.email ?? "Marchand"}</p>
          </div>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}

async function getPendingOrdersCount() {
  try {
    const orders = await listMerchantOrders({
      page: 0,
      size: 1,
      status: "pending",
    });
    return orders.totalElements;
  } catch {
    return 0;
  }
}
