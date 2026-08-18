import type { CSSProperties, ReactNode } from "react";

import { redirect } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CHANGE_PASSWORD_PATH } from "@/lib/auth/auth.constants";
import { isPasswordChangeRequired } from "@/lib/auth/auth.server";
import { listMerchantOrders } from "@/lib/commerce/commerce.server";
import { requireMerchantProfile } from "@/lib/merchant/merchant.server";
import { cn } from "@/lib/utils";

import { MerchantNav } from "./_components/merchant-nav";

export default async function MerchantLayout({ children }: { children: ReactNode }) {
  if (await isPasswordChangeRequired()) {
    redirect(CHANGE_PASSWORD_PATH);
  }

  const profile = await requireMerchantProfile();
  const pendingOrders = await getPendingOrdersCount();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
        } as CSSProperties
      }
    >
      <MerchantNav
        pendingOrders={pendingOrders}
        userLabel={profile.user.fullName ?? profile.user.email ?? "Marchand"}
      />
      <SidebarInset className={cn("peer-data-[variant=inset]:border")}>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur">
          <div className="flex w-full items-center gap-2 px-4 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">Espace marchand</p>
              <p className="truncate font-medium text-sm">
                {profile.user.fullName ?? profile.user.email ?? "Marchand"}
              </p>
            </div>
          </div>
        </header>
        <div className="h-full p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
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
