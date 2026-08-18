import type { ComponentType } from "react";

import { BadgeCheck, Building2, CircleAlert, UserRoundCheck, UsersRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAgencies, listAgencyAgents } from "@/lib/cash/cash.server";
import type { CashAgentContractResponse } from "@/lib/cash/cash.types";
import { listUsers } from "@/lib/iam/users.server";

import { type AgentContractSummary, AgentsAdminPanel } from "./_components/agents-admin-panel";

type AgentsPageProps = {
  searchParams?: Promise<{
    contractStatus?: string;
    page?: string;
    q?: string;
    size?: string;
    sort?: string;
    status?: string;
  }>;
};

const DEFAULT_PAGE_SIZE = 20;

export default async function AgentsPage({ searchParams }: AgentsPageProps) {
  const params = await searchParams;
  const page = toPositiveInteger(params?.page, 0);
  const size = toPositiveInteger(params?.size, DEFAULT_PAGE_SIZE);
  const sort = params?.sort || "createdAt,desc";
  const filters = {
    contractStatus: params?.contractStatus ?? "",
    q: params?.q ?? "",
    status: params?.status ?? "",
  };

  try {
    const [agents, agencies] = await Promise.all([
      listUsers({
        page,
        q: filters.q || undefined,
        size,
        sort,
        status: filters.status || undefined,
        type: "cash_agent",
      }),
      listAgencies({ size: 100, sort: "createdAt,desc" }),
    ]);

    const contractsEntries = await Promise.all(
      agencies.content.map(async (agency) => {
        const contracts = await listAgencyAgents(agency.id, { size: 100, sort: "createdAt,desc" }).catch(
          () =>
            ({
              content: [],
            }) as { content: CashAgentContractResponse[] },
        );

        return contracts.content.map((contract) => ({
          ...contract,
          agencyStatus: agency.status,
        }));
      }),
    );
    const contracts = contractsEntries.flat();
    const contractsByAgentId = contracts.reduce<Record<string, AgentContractSummary[]>>((accumulator, contract) => {
      accumulator[contract.agentUserId] = [...(accumulator[contract.agentUserId] ?? []), contract];
      return accumulator;
    }, {});

    const visibleAgents = filters.contractStatus
      ? agents.content.filter((agent) =>
          (contractsByAgentId[agent.id] ?? []).some((contract) => contract.status === filters.contractStatus),
        )
      : agents.content;

    const activeContracts = contracts.filter((contract) => contract.status === "active").length;
    const agentsWithContract = agents.content.filter((agent) => (contractsByAgentId[agent.id] ?? []).length > 0).length;
    const agentsWithoutContract = agents.content.length - agentsWithContract;

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <div className="grid gap-5 border-b bg-muted/20 p-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:p-6">
            <div>
              <p className="font-medium text-muted-foreground text-sm">Cash network staff</p>
              <h1 className="mt-1 font-semibold text-2xl tracking-tight md:text-3xl">Agents cash</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground text-sm">
                Suivez les agents autorises, leurs agences, leurs contrats actifs et les commissions appliquees aux
                operations cash.
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-sm">Contrats actifs</p>
                  <p className="mt-1 font-semibold text-3xl tracking-tight">{activeContracts}</p>
                </div>
                <BadgeCheck className="size-6 text-emerald-600" />
              </div>
              <p className="mt-3 border-t pt-3 text-muted-foreground text-xs">
                Les commissions se modifient depuis l'agence rattachee. Les operations deja preparees gardent leur
                breakdown fige.
              </p>
            </div>
          </div>

          <div className="grid gap-3 p-4 md:grid-cols-4">
            <MetricCard icon={UsersRound} label="Agents cash" value={agents.totalElements.toString()} />
            <MetricCard icon={UserRoundCheck} label="Sur cette page" value={visibleAgents.length.toString()} />
            <MetricCard icon={Building2} label="Avec contrat" value={agentsWithContract.toString()} />
            <MetricCard icon={CircleAlert} label="Sans contrat" value={agentsWithoutContract.toString()} />
          </div>
        </section>

        <AgentsAdminPanel
          agents={{
            ...agents,
            content: visibleAgents,
            empty: visibleAgents.length === 0,
          }}
          contractsByAgentId={contractsByAgentId}
          filters={filters}
          pageSize={size}
          sort={sort}
        />
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Agents cash</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger la liste des agents.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acces indisponible</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Le backend agents ne repond pas."}
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
          <p className="truncate font-semibold text-2xl">{value}</p>
        </div>
        <Icon className="size-5 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function toPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}
