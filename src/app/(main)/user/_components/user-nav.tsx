"use client";

import {
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { WorkspaceSidebar } from "@/app/(main)/_components/workspace-sidebar";

type UserNavProps = {
  balance?: {
    detail?: string;
    value: string;
  } | null;
  userLabel?: string | null;
};

const NAV_ITEMS = [
  { href: "/user/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/user/profile", icon: UserRound, label: "Profil" },
  { href: "/user/kyc", icon: ShieldCheck, label: "KYC" },
  { href: "/user/transactions", icon: ReceiptText, label: "Transactions" },
];

export function UserNav({ balance, userLabel }: UserNavProps) {
  return (
    <WorkspaceSidebar
      balanceCard={
        balance
          ? {
              detail: balance.detail,
              href: "/user/dashboard",
              label: "Solde disponible",
              value: balance.value,
            }
          : null
      }
      homeHref="/user/dashboard"
      items={NAV_ITEMS}
      subtitle="Wallet client"
      title="Neutrino Client"
      userLabel={userLabel}
    />
  );
}
