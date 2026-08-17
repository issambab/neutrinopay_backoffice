import { AlertTriangle, GitCompareArrows, Landmark, WalletCards } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { WalletBalanceResponse, WalletReconciliationResponse, WalletResponse } from "@/lib/wallet/wallet.types";
import { formatAssetMinorMoney } from "@/lib/wallet/wallet-format";

type UserWalletLedgerCardProps = {
  balance: WalletBalanceResponse | null;
  reconciliation: WalletReconciliationResponse | null;
  wallet: WalletResponse | null;
};

export function UserWalletLedgerCard({ balance, reconciliation, wallet }: UserWalletLedgerCardProps) {
  if (!wallet) {
    return null;
  }

  const asset = balance?.asset ?? reconciliation?.asset ?? "TND/2";
  const isMatched = reconciliation?.status === "matched";
  const isMismatched = reconciliation?.status === "mismatched";

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md border bg-muted/30">
              <GitCompareArrows className="size-4 text-muted-foreground" />
            </span>
            <div>
              <CardTitle>Solde ledger</CardTitle>
              <p className="text-muted-foreground text-xs">Source Ledger et projection locale transaction_views</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "w-fit",
              isMatched && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              isMismatched && "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
              !reconciliation && "border-muted-foreground/20 bg-muted text-muted-foreground",
            )}
          >
            {isMatched ? "reconcilie" : isMismatched ? "ecart detecte" : "non verifie"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr_1fr]">
          <LedgerMetric
            icon={Landmark}
            label="Solde Ledger"
            value={
              balance
                ? formatAssetMinorMoney(balance.availableBalanceMinor, balance.currency, balance.asset)
                : "Indisponible"
            }
            detail={balance?.accountAddress ?? "Compte ledger non charge"}
          />
          <LedgerMetric
            icon={WalletCards}
            label="Projection locale"
            value={
              reconciliation
                ? formatAssetMinorMoney(
                    reconciliation.projectedBalanceMinor,
                    reconciliation.currency,
                    reconciliation.asset,
                  )
                : "Indisponible"
            }
            detail="credits postes - debits postes"
          />
          <LedgerMetric
            icon={GitCompareArrows}
            label="Ecart"
            value={
              reconciliation
                ? formatAssetMinorMoney(reconciliation.differenceMinor, reconciliation.currency, reconciliation.asset)
                : "Indisponible"
            }
            detail={reconciliation ? `verifie le ${formatDateTime(reconciliation.checkedAt)}` : "Controle non charge"}
            tone={isMismatched ? "danger" : isMatched ? "success" : "neutral"}
          />
        </div>

        <div className="rounded-md border bg-muted/10 p-3">
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <LedgerFact label="Asset" value={asset} />
            <LedgerFact label="Source" value={formatBalanceSource(balance?.source)} />
            <LedgerFact label="Lecture" value={balance ? formatDateTime(balance.asOf) : "Indisponible"} />
          </div>
          <Separator className="my-3" />
          <div className="text-muted-foreground text-xs">
            Le backoffice affiche le meme solde Ledger que celui utilise pour bloquer un Cash-out insuffisant.
          </div>
        </div>

        {isMismatched ? (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Difference ledger detectee</AlertTitle>
            <AlertDescription>
              Le solde Ledger et la projection locale ne correspondent pas. Verifier les dernieres operations cash
              postees et les projections transaction_views avant toute action support.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

function LedgerMetric({
  detail,
  icon: Icon,
  label,
  tone = "neutral",
  value,
}: {
  detail: string;
  icon: typeof Landmark;
  label: string;
  tone?: "danger" | "neutral" | "success";
  value: string;
}) {
  return (
    <div
      className={cn(
        "grid min-h-28 gap-3 rounded-md border bg-card p-3",
        tone === "success" && "border-emerald-500/20 bg-emerald-500/5",
        tone === "danger" && "border-red-500/20 bg-red-500/5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-sm">{label}</span>
        <Icon
          className={cn(
            "size-4 text-muted-foreground",
            tone === "success" && "text-emerald-600",
            tone === "danger" && "text-red-600",
          )}
        />
      </div>
      <div className="grid gap-1">
        <span className="font-semibold text-xl">{value}</span>
        <span className="break-all text-muted-foreground text-xs">{detail}</span>
      </div>
    </div>
  );
}

function LedgerFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="break-all font-medium text-sm">{value}</span>
    </div>
  );
}

function formatBalanceSource(source?: string | null) {
  if (!source) {
    return "Ledger";
  }

  return source.toLowerCase() === "formance" ? "Ledger" : source;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
