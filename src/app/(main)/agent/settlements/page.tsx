import type { ComponentType } from "react";

import { AlertTriangle, Banknote, CheckCircle2, Clock3, Shuffle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCurrentAgentPhysicalCashBalance,
  getCurrentAgentProfile,
  listCurrentAgentSettlements,
} from "@/lib/cash/cash.server";
import type { AgentSettlementDirection, AgentSettlementResponse, AgentSettlementStatus } from "@/lib/cash/cash.types";
import { formatMinorAmount } from "@/lib/cash/cash-format";

import { AgentSettlementsTable } from "./_components/agent-settlements-table";

type AgentSettlementsPageProps = {
  searchParams?: Promise<{
    direction?: string;
    page?: string;
    q?: string;
    size?: string;
    sort?: string;
    status?: string;
  }>;
};

const PAGE_SIZE = 20;

export default async function AgentSettlementsPage({ searchParams }: AgentSettlementsPageProps) {
  const params = await searchParams;
  const page = toPageNumber(params?.page);
  const pageSize = toPageSize(params?.size);
  const sort = toSettlementSort(params?.sort);
  const filters = {
    direction: params?.direction ?? "",
    q: params?.q ?? "",
    status: params?.status ?? "",
  };

  try {
    const [profile, physicalCashBalance, settlements] = await Promise.all([
      getCurrentAgentProfile(),
      getCurrentAgentPhysicalCashBalance(),
      listCurrentAgentSettlements({
        direction: toSettlementDirection(filters.direction),
        page,
        q: filters.q || undefined,
        size: pageSize,
        sort,
        status: toSettlementStatus(filters.status),
      }),
    ]);
    const metrics = summarizeSettlements(settlements.content);

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Settlements</h1>
            <p className="text-muted-foreground text-sm">
              Historique pagine des mouvements Cash to Float et Float to Cash rattaches a votre caisse.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {profile.agencyCode} - {settlements.totalElements} settlements
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard
            icon={Banknote}
            label="Caisse physique"
            value={formatMinorAmount(physicalCashBalance.physicalCashBalanceMinor, physicalCashBalance.currency)}
          />
          <MetricCard icon={Shuffle} label="Settlements page" value={settlements.content.length.toString()} />
          <MetricCard icon={CheckCircle2} label="Montant poste page" value={formatMinorAmount(metrics.postedMinor)} />
          <MetricCard icon={Clock3} label="En attente page" value={metrics.pendingCount.toString()} />
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-2 border-b md:flex-row md:items-center md:justify-between">
            <CardTitle>Journal des settlements</CardTitle>
            {metrics.failedCount > 0 ? (
              <Badge variant="outline" className="w-fit border-orange-200 bg-orange-50 text-orange-700">
                <AlertTriangle className="size-3.5" />
                {metrics.failedCount} incident(s) sur page
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent>
            <AgentSettlementsTable filters={filters} pageSize={pageSize} settlements={settlements} sort={sort} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Settlements</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger vos settlements.</p>
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

function summarizeSettlements(settlements: AgentSettlementResponse[]) {
  return settlements.reduce(
    (totals, settlement) => ({
      failedCount: totals.failedCount + (["failed", "rejected"].includes(settlement.status) ? 1 : 0),
      pendingCount: totals.pendingCount + (settlement.status === "pending" ? 1 : 0),
      postedMinor: totals.postedMinor + (settlement.status === "posted" ? settlement.amountMinor : 0),
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

function toSettlementStatus(value?: string): AgentSettlementStatus | undefined {
  return value === "pending" || value === "posted" || value === "rejected" || value === "failed" ? value : undefined;
}

function toSettlementDirection(value?: string): AgentSettlementDirection | undefined {
  return value === "cash_to_float" || value === "float_to_cash" ? value : undefined;
}

function toSettlementSort(value?: string) {
  const allowedSorts = new Set([
    "amountMinor,asc",
    "amountMinor,desc",
    "createdAt,asc",
    "createdAt,desc",
    "direction,asc",
    "direction,desc",
    "postedAt,asc",
    "postedAt,desc",
    "status,asc",
    "status,desc",
  ]);

  return value && allowedSorts.has(value) ? value : "createdAt,desc";
}
