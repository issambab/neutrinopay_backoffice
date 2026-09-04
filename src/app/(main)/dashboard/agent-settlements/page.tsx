import type { ComponentType } from "react";

import { AlertTriangle, Banknote, CheckCircle2, Clock3, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgentSettlement, listAgencies, listAgencyAgents, listAgentSettlements } from "@/lib/cash/cash.server";
import type { CashAgentContractResponse } from "@/lib/cash/cash.types";

import { AgentSettlementsPanel } from "./_components/agent-settlements-panel";

type AgentSettlementsPageProps = {
  searchParams?: Promise<{
    agencyId?: string;
    agentUserId?: string;
    direction?: string;
    page?: string;
    q?: string;
    settlementId?: string;
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
    agencyId: params?.agencyId ?? "",
    agentUserId: params?.agentUserId ?? "",
    direction: params?.direction ?? "",
    q: params?.q ?? "",
    settlementId: params?.settlementId ?? "",
    status: params?.status ?? "",
  };

  try {
    const [settlements, agencies] = await Promise.all([
      listAgentSettlements({
        agencyId: filters.agencyId || undefined,
        agentUserId: filters.agentUserId || undefined,
        direction: filters.direction || undefined,
        page,
        q: filters.q || undefined,
        size: pageSize,
        sort,
        status: filters.status || undefined,
      }),
      listAgencies({ size: 100, sort: "name,asc", status: "active" }),
    ]);

    const contractsEntries = await Promise.all(
      agencies.content.map(async (agency) => {
        const contracts = await listAgencyAgents(agency.id, { size: 100, sort: "createdAt,desc" }).catch(
          () =>
            ({
              content: [],
            }) as { content: CashAgentContractResponse[] },
        );

        return [agency.id, contracts.content.filter((contract) => contract.status === "active")] as const;
      }),
    );
    const contractsByAgencyId = Object.fromEntries(contractsEntries);
    const selectedSettlement = filters.settlementId
      ? await getAgentSettlement(filters.settlementId).catch(() => null)
      : (settlements.content[0] ?? null);

    const pagePending = settlements.content.filter((settlement) => settlement.status === "pending").length;
    const pagePosted = settlements.content.filter((settlement) => settlement.status === "posted").length;
    const pageFailed = settlements.content.filter((settlement) => settlement.status === "failed").length;
    const pageRejected = settlements.content.filter((settlement) => settlement.status === "rejected").length;

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Settlements caisse/float</h1>
            <p className="text-muted-foreground text-sm">
              Decision finance pour les mouvements Cash to Float et Float to Cash des agents.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {settlements.totalElements} settlements
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard icon={Clock3} label="Pending page" value={pagePending.toString()} />
          <MetricCard icon={CheckCircle2} label="Postes page" value={pagePosted.toString()} />
          <MetricCard icon={AlertTriangle} label="Echecs page" value={pageFailed.toString()} />
          <MetricCard icon={XCircle} label="Rejetes page" value={pageRejected.toString()} />
        </div>

        <AgentSettlementsPanel
          agencies={agencies.content}
          contractsByAgencyId={contractsByAgencyId}
          filters={filters}
          pageSize={pageSize}
          selectedSettlement={selectedSettlement}
          settlements={settlements}
          sort={sort}
        />
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Settlements caisse/float</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger les mouvements caisse/float.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="size-5" />
              Acces indisponible
            </CardTitle>
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
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="font-semibold text-2xl">{value}</p>
        </div>
        <Icon className="size-5 text-muted-foreground" />
      </CardContent>
    </Card>
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
