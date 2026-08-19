"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { PauseCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LifecycleStatus, WalletResponse } from "@/lib/wallet/wallet.types";
import { formatMinorMoney, formatWalletEnum, walletStatusClassName } from "@/lib/wallet/wallet-format";

type UserWalletCardProps = {
  wallet: WalletResponse | null;
};

export function UserWalletCard({ wallet }: UserWalletCardProps) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function changeStatus(status: LifecycleStatus) {
    if (!wallet) {
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch(`/api/wallets/${wallet.id}/status`, {
        body: JSON.stringify({
          reason: status === "active" ? "reactivated_by_admin" : "suspended_by_admin",
          status,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const result = (await response.json().catch(() => null)) as { message?: string; wallet?: WalletResponse } | null;

      if (!response.ok || !result?.wallet) {
        toast.error(result?.message ?? "Impossible de modifier le wallet.");
        return;
      }

      toast.success("Statut wallet modifie.");
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Wallet client</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {wallet ? (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <Info
                label="Statut"
                value={formatWalletEnum(wallet.status)}
                badgeClassName={walletStatusClassName(wallet.status)}
              />
              <Info
                label="Solde en attente"
                value={formatMinorMoney(wallet.pendingBalanceMinor, wallet.defaultCurrency)}
              />
              <Info label="Comptes" value={wallet.accounts.length.toString()} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isBusy || wallet.status === "active"}
                onClick={() => changeStatus("active")}
              >
                <PlayCircle />
                Reactiver
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isBusy || wallet.status === "suspended"}
                onClick={() => changeStatus("suspended")}
              >
                <PauseCircle />
                Suspendre
              </Button>
            </div>
          </>
        ) : (
          <p className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
            Aucun wallet client trouve pour cet utilisateur.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Info({ badgeClassName, label, value }: { badgeClassName?: string; label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/15 p-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {badgeClassName ? (
        <Badge variant="outline" className={badgeClassName}>
          {value}
        </Badge>
      ) : (
        <span className="font-medium">{value}</span>
      )}
    </div>
  );
}
