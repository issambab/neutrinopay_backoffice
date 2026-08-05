"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Boxes,
  GitBranch,
  LayoutDashboard,
  LogOut,
  MapPin,
  MonitorSmartphone,
  ReceiptText,
  ShieldCheck,
  Store,
  TrendingUp,
} from "lucide-react";

import LogoNeutrinoCar from "@/components/icon/logo-neutrino-car";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/logout.client";
import { cn } from "@/lib/utils";

type MerchantNavItem = {
  children?: {
    href: string;
    icon: typeof LayoutDashboard;
    label: string;
  }[];
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
};

const NAV_ITEMS = [
  { href: "/merchant/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  {
    href: "/merchant/tree",
    icon: GitBranch,
    label: "Hierarchique",
    children: [
      { href: "/merchant/stations", icon: MapPin, label: "Stations" },
      { href: "/merchant/points-of-sale", icon: Store, label: "Points de vente" },
      { href: "/merchant/terminals", icon: MonitorSmartphone, label: "Terminaux" },
    ],
  },
  { href: "/merchant/kyc", icon: ShieldCheck, label: "KYC" },
  { href: "/merchant/commerce", icon: Boxes, label: "Boutique" },
  { href: "/merchant/orders", icon: ReceiptText, label: "Commandes" },
  { href: "/merchant/sales", icon: TrendingUp, label: "Ventes" },
] satisfies MerchantNavItem[];

type MerchantNavProps = {
  pendingOrders?: number;
};

export function MerchantNav({ pendingOrders = 0 }: MerchantNavProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen border-r bg-muted/20 lg:flex lg:flex-col">
      <div className="border-b p-4">
        <Link href="/merchant/dashboard" className="flex items-center gap-3">
          <LogoNeutrinoCar className="h-10 w-10 text-blue-500" />
          <span className="font-semibold">Neutrino Merchant</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || item.children?.some((child) => pathname === child.href);

          return (
            <div key={item.href} className="space-y-1">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                  isActive ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                <span className="truncate">{item.label}</span>
                {item.href === "/merchant/orders" && pendingOrders > 0 ? (
                  <Badge variant="secondary" className="ml-auto">
                    {pendingOrders > 99 ? "99+" : pendingOrders}
                  </Badge>
                ) : null}
              </Link>

              {item.children ? (
                <div className="ml-6 space-y-1 border-l pl-2">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const childIsActive = pathname === child.href;

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted",
                          childIsActive ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
                        )}
                      >
                        <ChildIcon className="size-3.5" />
                        <span className="truncate">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
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
