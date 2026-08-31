"use client";

import { useEffect, useState } from "react";

import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Clock3, Eye, Loader2, ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CashOperationResponse } from "@/lib/cash/cash.types";
import { cn } from "@/lib/utils";
import type { WalletTransactionResponse } from "@/lib/wallet/wallet.types";
import { formatAssetMinorMoney, formatWalletEnum } from "@/lib/wallet/wallet-format";

type UserWalletTransactionsCardProps = {
  counterpartyColumn?: boolean;
  description?: string;
  emptyDescription?: string;
  emptyTitle?: string;
  featured?: boolean;
  showMovementStatus?: boolean;
  showCashOperationDetails?: boolean;
  title?: string;
  transactions: WalletTransactionResponse[] | null;
};

type CashOperationApiResponse = {
  operation: CashOperationResponse;
};

export function UserWalletTransactionsCard({
  counterpartyColumn = false,
  description = "Derniers mouvements postes dans transaction_views",
  emptyDescription = "Les Cash-in/Cash-out postes apparaitront ici.",
  emptyTitle = "Aucun mouvement poste",
  featured = false,
  showMovementStatus = true,
  showCashOperationDetails = true,
  title = "Historique wallet",
  transactions,
}: UserWalletTransactionsCardProps) {
  return (
    <Card className={cn(featured && "border-primary/20 bg-primary/[0.025] shadow-sm")}>
      <CardHeader className={cn("border-b", featured && "bg-background/75")}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-md border bg-muted/30",
                featured && "size-10 border-primary/20 bg-primary/10 text-primary",
              )}
            >
              <ReceiptText className={cn("size-4 text-muted-foreground", featured && "size-5 text-primary")} />
            </span>
            <div>
              <CardTitle className={cn(featured && "text-xl")}>{title}</CardTitle>
              <p className="text-muted-foreground text-xs">{description}</p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit text-muted-foreground">
            {transactions ? `${transactions.length} mouvements` : "indisponible"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {transactions ? (
          transactions.length ? (
            <div className="overflow-x-auto rounded-md border bg-background">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="w-[150px]">Mouvement</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>{counterpartyColumn ? "Expediteur / destinataire" : "Reference"}</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                    <TableHead className="w-[96px] text-right">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <DirectionBadge
                          direction={transaction.direction}
                          showStatus={showMovementStatus}
                          status={transaction.status}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="grid gap-1">
                          <span className="font-medium text-sm">{formatWalletEnum(transaction.operationType)}</span>
                          <span className="text-muted-foreground text-xs">{transaction.asset}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatSignedAmount(transaction)}</TableCell>
                      <TableCell>
                        {counterpartyColumn ? (
                          <CounterpartyCell transaction={transaction} />
                        ) : (
                          <span className="block max-w-[260px] truncate font-mono text-muted-foreground text-xs">
                            {transaction.reference ?? transaction.id}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs">
                        {formatDateTime(transaction.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <TransactionDetailSheet
                          showCashOperationDetails={showCashOperationDetails}
                          transaction={transaction}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyHistory description={emptyDescription} title={emptyTitle} />
          )
        ) : (
          <UnavailableHistory />
        )}
      </CardContent>
    </Card>
  );
}

function TransactionDetailSheet({
  showCashOperationDetails,
  transaction,
}: {
  showCashOperationDetails: boolean;
  transaction: WalletTransactionResponse;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [operation, setOperation] = useState<CashOperationResponse | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);
  const metadataEntries = Object.entries(transaction.metadata ?? {});
  const cashOperationId = getCashOperationId(transaction.metadata);

  useEffect(() => {
    if (!showCashOperationDetails || !isOpen || !cashOperationId || operation) {
      return;
    }

    const controller = new AbortController();
    setIsLoadingOperation(true);
    setOperationError(null);

    fetch(`/api/cash/operations/${cashOperationId}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | (Partial<CashOperationApiResponse> & { message?: string })
          | null;
        if (!response.ok || !payload?.operation) {
          throw new Error(payload?.message ?? "Detail operation cash indisponible.");
        }
        setOperation(payload.operation);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setOperationError(error instanceof Error ? error.message : "Detail operation cash indisponible.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingOperation(false);
        }
      });

    return () => controller.abort();
  }, [cashOperationId, isOpen, operation, showCashOperationDetails]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye />
          Voir
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Detail mouvement wallet</SheetTitle>
          <SheetDescription>{transaction.reference ?? transaction.id}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-4 pb-4">
          <div className="grid gap-3 rounded-md border bg-muted/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <DirectionBadge direction={transaction.direction} status={transaction.status} />
              <span className="font-semibold text-lg">{formatSignedAmount(transaction)}</span>
            </div>
            <Separator />
            <div className="grid gap-3 md:grid-cols-2">
              <DetailFact label="Operation" value={formatWalletEnum(transaction.operationType)} />
              <DetailFact label="Asset" value={transaction.asset} />
              <DetailFact label="Wallet" value={transaction.walletId} mono />
              <DetailFact label="Transaction view" value={transaction.id} mono />
              <DetailFact label="Reference ledger" value={transaction.reference ?? "-"} mono />
              <DetailFact label="Date" value={formatDateTime(transaction.createdAt)} />
            </div>
          </div>

          {showCashOperationDetails ? (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Operation cash source</h3>
                {cashOperationId ? (
                  <Badge variant="outline" className="font-mono text-[11px] text-muted-foreground">
                    {shortId(cashOperationId)}
                  </Badge>
                ) : null}
              </div>
              <CashOperationPanel
                cashOperationId={cashOperationId}
                error={operationError}
                isLoading={isLoadingOperation}
                operation={operation}
              />
            </div>
          ) : null}

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Metadata cash / ledger</h3>
              <Badge variant="outline" className="text-muted-foreground">
                {metadataEntries.length} champs
              </Badge>
            </div>
            {metadataEntries.length ? (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableBody>
                    {metadataEntries.map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="w-[180px] align-top font-mono text-muted-foreground text-xs">
                          {key}
                        </TableCell>
                        <TableCell className="whitespace-normal break-all text-sm">
                          {formatMetadataValue(value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
                Aucune metadata disponible pour ce mouvement.
              </div>
            )}
          </div>

          {metadataEntries.length ? (
            <div className="grid gap-2">
              <h3 className="font-medium text-sm">Payload brut</h3>
              <pre className="max-h-72 overflow-auto rounded-md border bg-muted/20 p-3 text-xs">
                {JSON.stringify(transaction.metadata, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CashOperationPanel({
  cashOperationId,
  error,
  isLoading,
  operation,
}: {
  cashOperationId: string | null;
  error: string | null;
  isLoading: boolean;
  operation: CashOperationResponse | null;
}) {
  if (!cashOperationId) {
    return (
      <div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
        Aucun identifiant operation cash dans les metadata ledger.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-md border p-4 text-muted-foreground text-sm">
        <Loader2 className="size-4 animate-spin" />
        Chargement du detail operation cash...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 text-sm dark:text-amber-200">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!operation) {
    return (
      <div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
        Ouvrez le panneau pour charger le detail operation cash.
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-md border bg-background p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="secondary">{formatWalletEnum(operation.operationType)}</Badge>
        <Badge variant={operation.status === "posted" ? "default" : "outline"}>
          {formatWalletEnum(operation.status)}
        </Badge>
      </div>
      <Separator />
      <div className="grid gap-3 md:grid-cols-2">
        <DetailFact
          label="Montant cash"
          value={formatAssetMinorMoney(operation.amountMinor, operation.currency, "TND/2")}
        />
        <DetailFact label="Agence" value={operation.agencyCode} />
        <DetailFact label="Client" value={operation.customerName ?? operation.customerUserId} />
        <DetailFact label="Agent" value={operation.agentUserId} mono />
        <DetailFact label="Operation cash" value={operation.id} mono />
        <DetailFact label="Ledger transaction" value={operation.ledgerTransactionId ?? "-"} mono />
        <DetailFact label="Preparee le" value={operation.preparedAt ? formatDateTime(operation.preparedAt) : "-"} />
        <DetailFact label="Postee le" value={operation.postedAt ? formatDateTime(operation.postedAt) : "-"} />
      </div>
      {operation.failureReason ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
          {operation.failureReason}
        </div>
      ) : null}
    </div>
  );
}

function DetailFact({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn("break-all text-sm", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}

function CounterpartyCell({ transaction }: { transaction: WalletTransactionResponse }) {
  const counterparty = resolveCounterparty(transaction);

  return (
    <div className="grid max-w-[260px] gap-1">
      <span className="font-medium text-sm">{counterparty.name}</span>
      <span className="text-muted-foreground text-xs">{counterparty.label}</span>
    </div>
  );
}

function DirectionBadge({
  direction,
  showStatus = true,
  status,
}: {
  direction: string;
  showStatus?: boolean;
  status: string;
}) {
  const isCredit = direction === "credit";
  const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        isCredit && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        !isCredit && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      )}
    >
      <Icon className="size-3" />
      {formatWalletEnum(direction)}
      {showStatus ? (
        <>
          <span className="text-muted-foreground">/</span>
          {formatWalletEnum(status)}
        </>
      ) : null}
    </Badge>
  );
}

function EmptyHistory({ description, title }: { description: string; title: string }) {
  return (
    <div className="grid place-items-center gap-2 rounded-md border border-dashed p-6 text-center">
      <Clock3 className="size-5 text-muted-foreground" />
      <p className="font-medium text-sm">{title}</p>
      <p className="text-muted-foreground text-xs">{description}</p>
    </div>
  );
}

function UnavailableHistory() {
  return (
    <div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
      Historique wallet indisponible pour le moment.
    </div>
  );
}

function getCashOperationId(metadata?: Record<string, unknown> | null) {
  const value = metadata?.cash_operation_id ?? metadata?.cashOperationId;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function resolveCounterparty(transaction: WalletTransactionResponse) {
  const metadata = transaction.metadata ?? {};
  const source = metadataString(metadata, "source");
  const isDebit = transaction.direction === "debit";
  const fallbackLabel = isDebit ? "Destinataire" : "Expediteur";
  const fallbackName =
    metadataString(metadata, "counterpartyName") ??
    metadataString(metadata, "merchantName") ??
    metadataString(metadata, isDebit ? "receiverName" : "senderName") ??
    metadataString(metadata, isDebit ? "receiverCustomerId" : "senderCustomerId") ??
    metadataString(metadata, "counterpartyCustomerId") ??
    metadataString(metadata, "agentName") ??
    metadataString(metadata, "agentUserId") ??
    transaction.reference ??
    shortId(transaction.id);

  if (source === "customer_transfer") {
    return {
      label: isDebit ? "Destinataire du transfert" : "Expediteur du transfert",
      name: fallbackName,
    };
  }

  if (source === "customer_pos_payment" || transaction.operationType === "payment") {
    return {
      label: isDebit ? "Marchand destinataire" : "Client expediteur",
      name: fallbackName,
    };
  }

  if (source === "cash_operation" || transaction.operationType.startsWith("cash_")) {
    return {
      label: isDebit ? "Agent destinataire" : "Agent expediteur",
      name: fallbackName,
    };
  }

  return {
    label: fallbackLabel,
    name: fallbackName,
  };
}

function metadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function shortId(value: string) {
  return value.length > 13 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function formatSignedAmount(transaction: WalletTransactionResponse) {
  const sign = transaction.direction === "debit" ? "-" : "+";
  const currency = transaction.asset.split("/")[0] || "TND";

  return `${sign}${formatAssetMinorMoney(transaction.amountMinor, currency, transaction.asset)}`;
}

function formatMetadataValue(value: unknown) {
  if (value == null) {
    return "-";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
