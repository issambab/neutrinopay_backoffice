import type { ComponentType } from "react";

import { AlertTriangle, Banknote, CheckCircle2, Clock3, HandCoins } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCurrentAgentEarningsBalance,
  getCurrentAgentProfile,
  listCurrentAgentPayouts,
} from "@/lib/cash/cash.server";
import type { AgentPayoutResponse, AgentPayoutStatus } from "@/lib/cash/cash.types";
import { formatMinorAmount } from "@/lib/cash/cash-format";

import { AgentPayoutsTable } from "./_components/agent-payouts-table";

type AgentPayoutsPageProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
    size?: string;
    sort?: string;
    status?: string;
  }>;
};

const PAGE_SIZE = 20;

export default async function AgentPayoutsPage({ searchParams }: AgentPayoutsPageProps) {
  const params = await searchParams;
  const page = toPageNumber(params?.page);
  const pageSize = toPageSize(params?.size);
  const sort = toPayoutSort(params?.sort);
  const filters = {
    q: params?.q ?? "",
    status: params?.status ?? "",
  };

  try {
    const [profile, earningsBalance, payouts] = await Promise.all([
      getCurrentAgentProfile(),
      getCurrentAgentEarningsBalance(),
      listCurrentAgentPayouts({
        page,
        q: filters.q || undefined,
        size: pageSize,
        sort,
        status: toPayoutStatus(filters.status),
      }),
    ]);
    const metrics = summarizePayouts(payouts.content);

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Payouts</h1>
            <p className="text-muted-foreground text-sm">
              Historique pagine des paiements de commissions rattaches a votre compte agent.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {profile.agencyCode} - {payouts.totalElements} payouts
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard
            icon={HandCoins}
            label="Earnings disponible"
            value={formatMinorAmount(earningsBalance.balanceMinor, earningsBalance.currency)}
          />
          <MetricCard icon={Banknote} label="Payouts page" value={payouts.content.length.toString()} />
          <MetricCard icon={CheckCircle2} label="Montant paye page" value={formatMinorAmount(metrics.postedMinor)} />
          <MetricCard icon={Clock3} label="En attente page" value={metrics.pendingCount.toString()} />
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-2 border-b md:flex-row md:items-center md:justify-between">
            <CardTitle>Journal des payouts</CardTitle>
            {metrics.failedCount > 0 ? (
              <Badge variant="outline" className="w-fit border-orange-200 bg-orange-50 text-orange-700">
                <AlertTriangle className="size-3.5" />
                {metrics.failedCount} incident(s) sur page
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent>
            <AgentPayoutsTable filters={filters} pageSize={pageSize} payouts={payouts} sort={sort} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Payouts</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger vos payouts.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Historique indisponible</CardTitle>
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
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="truncate font-semibold text-xl">{value}</p>
        </div>
        <Icon className="size-5 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function summarizePayouts(payouts: AgentPayoutResponse[]) {
  return payouts.reduce(
    (totals, payout) => ({
      failedCount: totals.failedCount + (["failed", "rejected"].includes(payout.status) ? 1 : 0),
      pendingCount: totals.pendingCount + (payout.status === "pending" ? 1 : 0),
      postedMinor: totals.postedMinor + (payout.status === "posted" ? payout.amountMinor : 0),
    }),
    {
      failedCount: 0,
      pendingCount: 0,
      postedMinor: 0,
    },
  );
}

function toPageNumber(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function toPageSize(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : PAGE_SIZE;
}

function toPayoutStatus(value?: string): AgentPayoutStatus | undefined {
  return value === "pending" || value === "posted" || value === "rejected" || value === "failed" ? value : undefined;
}

function toPayoutSort(value?: string) {
  const allowedSorts = new Set([
    "amountMinor,asc",
    "amountMinor,desc",
    "createdAt,asc",
    "createdAt,desc",
    "paidAt,asc",
    "paidAt,desc",
    "status,asc",
    "status,desc",
  ]);

  return value && allowedSorts.has(value) ? value : "createdAt,desc";
}
