import type { ReactNode } from "react";

import { WalletMovementsCard } from "@/app/(main)/dashboard/wallets/[walletId]/_components/wallet-movements-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { listCurrentCustomerWalletTransactions } from "@/lib/wallet/wallet.server";

type UserTransactionsPageProps = {
  searchParams?: Promise<{
    txDirection?: string;
    txPage?: string;
    txPeriod?: string;
    txQuery?: string;
    txSize?: string;
    txSort?: string;
    txType?: string;
  }>;
};

export default async function UserTransactionsPage({ searchParams }: UserTransactionsPageProps) {
  const query = await searchParams;
  const pageSize = parseTransactionPageSize(query?.txSize);
  const filters = normalizeFilters(query);

  try {
    const transactions = await listCurrentCustomerWalletTransactions({
      createdFrom: createdFromForPeriod(filters.period),
      direction: filters.direction,
      operationType: filters.type,
      page: parseTransactionPage(query?.txPage),
      query: filters.query,
      size: pageSize,
      sort: query?.txSort?.trim() || "createdAt,desc",
    });

    return (
      <div className="grid gap-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Transactions</h1>
            <p className="text-muted-foreground text-sm">Consultez vos paiements, transferts, cash-in et cash-out.</p>
          </div>
          <Badge variant="outline">{transactions.totalElements} transaction(s)</Badge>
        </div>

        <TransactionFilters filters={filters} pageSize={pageSize} />

        <WalletMovementsCard
          counterpartyColumn
          description="Historique complet des transactions realisees avec votre wallet."
          emptyDescription="Vos paiements, transferts, cash-in et cash-out apparaitront ici."
          emptyTitle="Aucune transaction client"
          featured
          pageSize={pageSize}
          showCashOperationDetails={false}
          showMovementStatus={false}
          title="Transactions effectuees"
          transactions={transactions}
        />
      </div>
    );
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions indisponibles</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Impossible de charger vos transactions."}
        </CardContent>
      </Card>
    );
  }
}

function TransactionFilters({
  filters,
  pageSize,
}: {
  filters: {
    direction: string;
    period: string;
    query: string;
    type: string;
  };
  pageSize: number;
}) {
  const hasFilters =
    filters.type !== "all" || filters.direction !== "all" || filters.period !== "all" || Boolean(filters.query);

  return (
    <Card className="shadow-xs">
      <CardContent>
        <form className="grid gap-3 lg:grid-cols-[1fr_auto]" method="get">
          <input name="txPage" type="hidden" value="0" />
          <input name="txSize" type="hidden" value={pageSize} />
          <input name="txSort" type="hidden" value="createdAt,desc" />
          <div className="grid gap-3 md:grid-cols-[1.1fr_1fr_1fr_1.4fr]">
            <FilterField label="Type">
              <NativeSelect className="w-full" defaultValue={filters.type} name="txType">
                <NativeSelectOption value="all">Tous</NativeSelectOption>
                <NativeSelectOption value="payment">Paiements</NativeSelectOption>
                <NativeSelectOption value="transfer">Transferts</NativeSelectOption>
                <NativeSelectOption value="cash_in">Cash-in</NativeSelectOption>
                <NativeSelectOption value="cash_out">Cash-out</NativeSelectOption>
              </NativeSelect>
            </FilterField>
            <FilterField label="Sens">
              <NativeSelect className="w-full" defaultValue={filters.direction} name="txDirection">
                <NativeSelectOption value="all">Tous</NativeSelectOption>
                <NativeSelectOption value="credit">Entrees</NativeSelectOption>
                <NativeSelectOption value="debit">Sorties</NativeSelectOption>
              </NativeSelect>
            </FilterField>
            <FilterField label="Periode">
              <NativeSelect className="w-full" defaultValue={filters.period} name="txPeriod">
                <NativeSelectOption value="7d">7 jours</NativeSelectOption>
                <NativeSelectOption value="30d">30 jours</NativeSelectOption>
                <NativeSelectOption value="90d">90 jours</NativeSelectOption>
                <NativeSelectOption value="all">Tout</NativeSelectOption>
              </NativeSelect>
            </FilterField>
            <FilterField label="Recherche">
              <Input
                defaultValue={filters.query}
                name="txQuery"
                placeholder="Nom, marchand, agent, reference..."
                type="search"
              />
            </FilterField>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <Button type="submit">Filtrer</Button>
            {hasFilters ? (
              <Button asChild type="button" variant="outline">
                <a href="/user/transactions">Reinitialiser</a>
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FilterField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="grid gap-1.5">
      <span className="font-medium text-muted-foreground text-xs">{label}</span>
      {children}
    </div>
  );
}

function normalizeFilters(query?: { txDirection?: string; txPeriod?: string; txQuery?: string; txType?: string }) {
  return {
    direction: oneOf(query?.txDirection, ["all", "credit", "debit"], "all"),
    period: oneOf(query?.txPeriod, ["7d", "30d", "90d", "all"], "all"),
    query: query?.txQuery?.trim() ?? "",
    type: oneOf(query?.txType, ["all", "payment", "transfer", "cash_in", "cash_out"], "all"),
  };
}

function oneOf<T extends string>(value: string | undefined, allowed: T[], fallback: T) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function createdFromForPeriod(period: string) {
  const daysByPeriod: Record<string, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };
  const days = daysByPeriod[period];
  if (!days) {
    return undefined;
  }
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function parseTransactionPage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function parseTransactionPageSize(value: string | undefined) {
  const parsed = Number(value);
  return [10, 20, 30, 40, 50].includes(parsed) ? parsed : 10;
}
