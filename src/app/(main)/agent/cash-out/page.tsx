import type { ComponentType } from "react";

import { Banknote, BanknoteArrowDown, CheckCircle2, Clock3, HandCoins, ShieldCheck, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCurrentAgentEarningsBalance,
  getCurrentAgentFloatBalance,
  getCurrentAgentPhysicalCashBalance,
  getCurrentAgentProfile,
  listCurrentAgentCashOperations,
} from "@/lib/cash/cash.server";
import type { CashOperationResponse } from "@/lib/cash/cash.types";
import { cashStatusClassName, formatCashStatus, formatMinorAmount } from "@/lib/cash/cash-format";

import { AgentOperationsTable } from "../operations/_components/agent-operations-table";
import { AgentCashOutPanel } from "./_components/agent-cash-out-panel";

type AgentCashOutPageProps = {
  searchParams?: Promise<{
    page?: string;
    size?: string;
    sort?: string;
  }>;
};

const PAGE_SIZE = 10;

export default async function AgentCashOutPage({ searchParams }: AgentCashOutPageProps) {
  const params = await searchParams;
  const page = toPageNumber(params?.page);
  const pageSize = toPageSize(params?.size);
  const sort = toCashOperationSort(params?.sort);

  try {
    const [profile, floatBalance, earningsBalance, physicalCashBalance, cashOutOperations] = await Promise.all([
      getCurrentAgentProfile(),
      getCurrentAgentFloatBalance(),
      getCurrentAgentEarningsBalance(),
      getCurrentAgentPhysicalCashBalance(),
      listCurrentAgentCashOperations({ operationType: "cash_out", page, size: pageSize, sort }),
    ]);
    const metrics = summarizeCashOutPage(cashOutOperations.content);

    return (
      <div className="flex flex-col gap-5 md:gap-6">
        <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <div className="grid gap-5 border-b bg-muted/20 p-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:p-6">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                  Cash-out agent
                </Badge>
                <Badge className={cashStatusClassName(profile.status)} variant="outline">
                  Contrat {formatCashStatus(profile.status)}
                </Badge>
              </div>
              <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Retrait client</h1>
              <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
                Saisissez le cash a remettre, affichez la commission et faites confirmer le client par OTP avant le
                posting Ledger.
              </p>
            </div>

            <div className="rounded-lg border bg-background p-4">
              <p className="text-muted-foreground text-sm">Float disponible</p>
              <p className="mt-1 font-semibold text-3xl tracking-tight">
                {formatMinorAmount(floatBalance.availableBalanceMinor, floatBalance.currency)}
              </p>
              <div className="mt-3 grid gap-1 text-xs">
                <span className="text-muted-foreground">
                  {profile.agencyCode} - {profile.agencyName}
                </span>
                <span className="break-all font-mono text-muted-foreground">{floatBalance.accountAddress}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:p-5">
            <AgentCashOutPanel contract={profile} />

            <div className="grid content-start gap-3">
              <MetricCard
                icon={BanknoteArrowDown}
                label="Cash remis"
                value={formatMinorAmount(metrics.cashToCustomerMinor)}
                helper="Cash-out postes sur cette page"
              />
              <MetricCard
                icon={WalletCards}
                label="Debit wallets"
                value={formatMinorAmount(metrics.totalDebitMinor)}
                helper="Montant cash + commissions"
              />
              <MetricCard
                icon={HandCoins}
                label="Earnings agent"
                value={formatMinorAmount(earningsBalance.balanceMinor, earningsBalance.currency)}
                helper={earningsBalance.accountAddress}
              />
              <MetricCard
                icon={Banknote}
                label="Cash physique"
                value={formatMinorAmount(physicalCashBalance.physicalCashBalanceMinor, physicalCashBalance.currency)}
                helper={`In ${formatMinorAmount(physicalCashBalance.cashInPostedMinor, physicalCashBalance.currency)} · Out ${formatMinorAmount(physicalCashBalance.cashOutPostedMinor, physicalCashBalance.currency)} · Cash->Float ${formatMinorAmount(physicalCashBalance.cashToFloatPostedMinor, physicalCashBalance.currency)} · Float->Cash ${formatMinorAmount(physicalCashBalance.floatToCashPostedMinor, physicalCashBalance.currency)}`}
              />
            </div>
          </div>
        </section>

        <Card>
          <CardHeader className="flex flex-col gap-3 border-b md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5" />
                Operations Cash-out
              </CardTitle>
              <CardDescription>Journal pagine des retraits clients traites par votre caisse.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{cashOutOperations.totalElements} Cash-out</Badge>
              <Badge variant="outline">
                <CheckCircle2 className="size-3.5" />
                {metrics.postedCount} postees
              </Badge>
              <Badge variant="outline">
                <Clock3 className="size-3.5" />
                {metrics.waitingCount} en cours
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <AgentOperationsTable operations={cashOutOperations} pageSize={pageSize} sort={sort} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Cash-out agent</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger l'espace Cash-out.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Cash-out indisponible</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Le backend cash ne repond pas."}
          </CardContent>
        </Card>
      </div>
    );
  }
}

function MetricCard({
  helper,
  icon: Icon,
  label,
  value,
}: {
  helper: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="truncate font-semibold text-xl">{value}</p>
          <p className="text-muted-foreground text-xs">{helper}</p>
        </div>
        <Icon className="mt-1 size-5 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function summarizeCashOutPage(operations: CashOperationResponse[]) {
  return operations.reduce(
    (totals, operation) => {
      if (operation.status !== "posted") {
        return {
          cashToCustomerMinor: totals.cashToCustomerMinor,
          postedCount: totals.postedCount,
          totalDebitMinor: totals.totalDebitMinor,
          waitingCount: totals.waitingCount + (["otp_pending", "prepared"].includes(operation.status) ? 1 : 0),
        };
      }
      const breakdown = cashOutBreakdown(operation);
      return {
        cashToCustomerMinor: totals.cashToCustomerMinor + breakdown.cashToCustomerMinor,
        postedCount: totals.postedCount + 1,
        totalDebitMinor: totals.totalDebitMinor + breakdown.totalDebitMinor,
        waitingCount: totals.waitingCount,
      };
    },
    {
      cashToCustomerMinor: 0,
      postedCount: 0,
      totalDebitMinor: 0,
      waitingCount: 0,
    },
  );
}

function cashOutBreakdown(operation: CashOperationResponse) {
  const cashToCustomerMinor = operation.grossAmountMinor ?? operation.amountMinor;
  const commissionMinor = operation.commissionAmountMinor ?? 0;

  return {
    cashToCustomerMinor,
    totalDebitMinor: cashToCustomerMinor + commissionMinor,
  };
}

function toPageNumber(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function toPageSize(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : PAGE_SIZE;
}

function toCashOperationSort(value?: string) {
  const allowedSorts = new Set([
    "amountMinor,asc",
    "amountMinor,desc",
    "createdAt,asc",
    "createdAt,desc",
    "operationType,asc",
    "operationType,desc",
    "postedAt,asc",
    "postedAt,desc",
    "status,asc",
    "status,desc",
  ]);

  return value && allowedSorts.has(value) ? value : "createdAt,desc";
}
