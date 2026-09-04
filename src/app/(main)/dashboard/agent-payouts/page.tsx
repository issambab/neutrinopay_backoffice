import type { ComponentType } from "react";

import { AlertTriangle, Banknote, CheckCircle2, Clock3, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgentPayout, listAgencies, listAgencyAgents, listAgentPayouts } from "@/lib/cash/cash.server";
import type { AgentPayoutResponse, CashAgentContractResponse, PageResponse } from "@/lib/cash/cash.types";

import { AgentPayoutsPanel } from "./_components/agent-payouts-panel";

type AgentPayoutsPageProps = {
  searchParams?: Promise<{
    agencyId?: string;
    agencyPage?: string;
    agencyQ?: string;
    agencySize?: string;
    agencySort?: string;
    agencyStatus?: string;
    agentUserId?: string;
    page?: string;
    payoutId?: string;
    q?: string;
    size?: string;
    sort?: string;
    status?: string;
  }>;
};

const PAGE_SIZE = 20;
const AGENCY_PAGE_SIZE = 10;

export default async function AgentPayoutsPage({ searchParams }: AgentPayoutsPageProps) {
  const params = await searchParams;
  const page = toPageNumber(params?.page);
  const pageSize = toPageSize(params?.size, PAGE_SIZE);
  const sort = toPayoutSort(params?.sort);
  const agencyPage = toPageNumber(params?.agencyPage);
  const agencyPageSize = toPageSize(params?.agencySize, AGENCY_PAGE_SIZE);
  const agencySort = toAgencySort(params?.agencySort);
  const requestedFilters = {
    agencyId: params?.agencyId ?? "",
    agencyQ: params?.agencyQ ?? "",
    agencyStatus: params?.agencyStatus ?? "",
    agentUserId: params?.agentUserId ?? "",
    payoutId: params?.payoutId ?? "",
    q: params?.q ?? "",
    status: params?.status ?? "",
  };

  try {
    const agencies = await listAgencies({
      page: agencyPage,
      q: requestedFilters.agencyQ || undefined,
      size: agencyPageSize,
      sort: agencySort,
      status: requestedFilters.agencyStatus || undefined,
    });

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

    const selectedAgencyId = agencies.content.some((agency) => agency.id === requestedFilters.agencyId)
      ? requestedFilters.agencyId
      : "";
    const selectedAgencyContracts = contractsByAgencyId[selectedAgencyId] ?? [];
    const selectedAgentUserId = selectedAgencyContracts.some(
      (contract) => contract.agentUserId === requestedFilters.agentUserId,
    )
      ? requestedFilters.agentUserId
      : "";

    const hasSelectedAgent = Boolean(selectedAgencyId && selectedAgentUserId);
    const payouts = hasSelectedAgent
      ? await listAgentPayouts({
          agencyId: selectedAgencyId,
          agentUserId: selectedAgentUserId,
          page,
          q: requestedFilters.q || undefined,
          size: pageSize,
          sort,
          status: requestedFilters.status || undefined,
        })
      : emptyPayoutPage(page, pageSize);

    const selectedPayout =
      hasSelectedAgent && requestedFilters.payoutId
        ? await getAgentPayout(requestedFilters.payoutId).catch(() => null)
        : (payouts.content[0] ?? null);

    const filters = {
      ...requestedFilters,
      agencyId: selectedAgencyId,
      agentUserId: selectedAgentUserId,
    };

    const pagePending = payouts.content.filter((payout) => payout.status === "pending").length;
    const pagePosted = payouts.content.filter((payout) => payout.status === "posted").length;
    const pageFailed = payouts.content.filter((payout) => payout.status === "failed").length;
    const pageRejected = payouts.content.filter((payout) => payout.status === "rejected").length;

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Payouts agents</h1>
            <p className="text-muted-foreground text-sm">
              Rechercher une agence, choisir un agent lie, puis consulter ses payouts ou creer une operation.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {payouts.totalElements} operation(s) agent
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard icon={Clock3} label="Pending page" value={pagePending.toString()} />
          <MetricCard icon={CheckCircle2} label="Payes page" value={pagePosted.toString()} />
          <MetricCard icon={AlertTriangle} label="Echecs page" value={pageFailed.toString()} />
          <MetricCard icon={XCircle} label="Rejetes page" value={pageRejected.toString()} />
        </div>

        <AgentPayoutsPanel
          agencies={agencies}
          agencyPageSize={agencyPageSize}
          agencySort={agencySort}
          contractsByAgencyId={contractsByAgencyId}
          filters={filters}
          pageSize={pageSize}
          payouts={payouts}
          selectedPayout={selectedPayout}
          sort={sort}
        />
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Payouts agents</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger le cockpit payout agent.</p>
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

function emptyPayoutPage(page: number, size: number): PageResponse<AgentPayoutResponse> {
  return {
    content: [],
    empty: true,
    first: true,
    last: true,
    page,
    size,
    totalElements: 0,
    totalPages: 0,
  };
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

function toPageSize(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function toAgencySort(value?: string) {
  const allowedSorts = new Set([
    "agencyCode,asc",
    "agencyCode,desc",
    "createdAt,asc",
    "createdAt,desc",
    "name,asc",
    "name,desc",
    "status,asc",
    "status,desc",
  ]);

  return value && allowedSorts.has(value) ? value : "name,asc";
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
