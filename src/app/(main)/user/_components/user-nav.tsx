"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BadgeCheck, LayoutDashboard, LogOut, ReceiptText, Send, ShieldCheck, UserRound, WalletCards } from "lucide-react";

import LogoNeutrinoCar from "@/components/icon/logo-neutrino-car";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/logout.client";
import { cn } from "@/lib/utils";

type UserNavItem = {
  disabled?: boolean;
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
};

const NAV_ITEMS = [
  { href: "/user/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/user/profile", icon: UserRound, label: "Profil" },
  { href: "/user/kyc", icon: ShieldCheck, label: "KYC" },
  { href: "/user/transactions", icon: ReceiptText, label: "Transactions", disabled: true },
  { href: "/user/transfers", icon: Send, label: "Transferts", disabled: true },
  { href: "/user/instruments", icon: WalletCards, label: "Moyens de paiement", disabled: true },
] satisfies UserNavItem[];

export function UserNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen border-r bg-muted/20 lg:flex lg:flex-col">
      <div className="border-b p-4">
        <Link href="/user/dashboard" className="flex items-center gap-3">
          <LogoNeutrinoCar className="h-10 w-10 text-blue-500" />
          <span className="grid min-w-0">
            <span className="font-semibold">Neutrino User</span>
            <span className="text-muted-foreground text-xs">Wallet client</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

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
