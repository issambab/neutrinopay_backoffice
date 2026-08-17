"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BadgeCheck, Landmark, LayoutDashboard, LogOut, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";

import LogoNeutrinoCar from "@/components/icon/logo-neutrino-car";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/logout.client";
import { cn } from "@/lib/utils";

type AgentNavItem = {
  disabled?: boolean;
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
};

const NAV_ITEMS: AgentNavItem[] = [
  { href: "/agent/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/agent/cash-in", icon: Landmark, label: "Cash-in" },
  { href: "/agent/cash-out", icon: ShieldCheck, label: "Cash-out" },
  { href: "/agent/operations", icon: ReceiptText, label: "Operations" },
  { href: "/agent/float-topups", icon: WalletCards, label: "Alimentations float" },
];

export function AgentNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen border-r bg-muted/20 lg:flex lg:flex-col">
      <div className="border-b p-4">
        <Link href="/agent/dashboard" className="flex items-center gap-3">
          <LogoNeutrinoCar className="h-10 w-10 text-blue-500" />
          <span className="grid min-w-0">
            <span className="font-semibold">Neutrino Agent</span>
            <span className="text-muted-foreground text-xs">Operations cash</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const itemPathname = item.href.split("#")[0];
          const isActive = pathname === itemPathname && !item.href.includes("#");

          if (item.disabled) {
            return (
              <button
                key={item.href}
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-left text-muted-foreground text-sm opacity-70"
              >
                <Icon className="size-4" />
                <span className="truncate">{item.label}</span>
                <BadgeCheck className="ml-auto size-3.5 opacity-40" />
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                isActive ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => logout()}>
          <LogOut className="size-4" />
          Deconnexion
        </Button>
      </div>
    </aside>
  );
}
