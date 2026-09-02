"use client";

import {
  ArrowLeftRight,
  Boxes,
  GitBranch,
  LayoutDashboard,
  MapPin,
  MonitorSmartphone,
  ReceiptText,
  ShieldCheck,
  Store,
  TrendingUp,
} from "lucide-react";

import { WorkspaceSidebar } from "@/app/(main)/_components/workspace-sidebar";

type MerchantNavProps = {
  pendingOrders?: number;
  userLabel?: string | null;
};

export function MerchantNav({ pendingOrders = 0, userLabel }: MerchantNavProps) {
  const pendingOrdersBadge = pendingOrders > 0 ? (pendingOrders > 99 ? "99+" : pendingOrders) : null;

  return (
    <WorkspaceSidebar
      homeHref="/merchant/dashboard"
      items={[
        { href: "/merchant/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        {
          children: [
            { href: "/merchant/stations", icon: MapPin, label: "Stations" },
            { href: "/merchant/points-of-sale", icon: Store, label: "Points de vente" },
            { href: "/merchant/terminals", icon: MonitorSmartphone, label: "Terminaux" },
          ],
          href: "/merchant/tree",
          icon: GitBranch,
          label: "Hierarchique",
        },
        { href: "/merchant/kyc", icon: ShieldCheck, label: "KYB" },
        { href: "/merchant/commerce", icon: Boxes, label: "Boutique" },
        { badge: pendingOrdersBadge, href: "/merchant/orders", icon: ReceiptText, label: "Commandes" },
        { href: "/merchant/sales", icon: TrendingUp, label: "Ventes" },
        { href: "/merchant/transactions", icon: ArrowLeftRight, label: "Transactions" },
      ]}
      subtitle="Commerce"
      title="Neutrino Merchant"
      userLabel={userLabel}
    />
  );
}
