"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { WalletCards } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ProvisionUserWalletButton() {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function provisionWallet() {
    setIsBusy(true);
    try {
      const response = await fetch("/api/customer/wallet", { method: "POST" });
      const result = (await response.json().catch(() => null)) as { message?: string; wallet?: unknown } | null;

      if (!response.ok || !result?.wallet) {
        toast.error(result?.message ?? "Impossible de creer le wallet.");
        return;
      }

      toast.success("Wallet cree.");
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Button onClick={provisionWallet} disabled={isBusy}>
      <WalletCards />
      {isBusy ? "Creation..." : "Creer mon wallet"}
    </Button>
  );
}
