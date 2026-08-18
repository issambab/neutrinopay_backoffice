"use client";

import { Landmark, LayoutDashboard, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";

import { WorkspaceSidebar } from "@/app/(main)/_components/workspace-sidebar";

type AgentNavProps = {
  userLabel?: string | null;
};

const NAV_ITEMS = [
  { href: "/agent/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/agent/cash-in", icon: Landmark, label: "Cash-in" },
  { href: "/agent/cash-out", icon: ShieldCheck, label: "Cash-out" },
  { href: "/agent/operations", icon: ReceiptText, label: "Operations" },
  { href: "/agent/float-topups", icon: WalletCards, label: "Alimentations float" },
];

export function AgentNav({ userLabel }: AgentNavProps) {
  return (
    <WorkspaceSidebar
      homeHref="/agent/dashboard"
      items={NAV_ITEMS}
      subtitle="Operations cash"
      title="Neutrino Agent"
      userLabel={userLabel}
    />
  );
}
