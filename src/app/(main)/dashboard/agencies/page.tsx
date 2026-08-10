import type { ComponentType } from "react";

import { Building2, Landmark, ShieldCheck, UserRoundCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAgencies, listAgencyAgents } from "@/lib/cash/cash.server";
import type { CashAgentContractResponse } from "@/lib/cash/cash.types";
import { listUsers } from "@/lib/iam/users.server";

import { AgenciesAdminPanel } from "./_components/agencies-admin-panel";

type AgenciesPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
};

export default async function AgenciesPage({ searchParams }: AgenciesPageProps) {
  const params = await searchParams;
  const filters = {
    q: params?.q ?? "",
    status: params?.status ?? "",
  };

  try {
    const [agencies, cashAgents] = await Promise.all([
      listAgencies({
        size: 100,
        sort: "createdAt,desc",
        status: filters.status || undefined,
      }),
      listUsers({
        page: 0,
        size: 100,
        sort: "createdAt,desc",
        type: "cash_agent",
      }),
    ]);
    const contractsEntries = await Promise.all(
      agencies.content.map(async (agency) => {
        const contracts = await listAgencyAgents(agency.id, { size: 50, sort: "createdAt,desc" }).catch(
          () =>
            ({
              content: [],
            }) as { content: CashAgentContractResponse[] },
        );

        return [agency.id, contracts.content] as const;
      }),
    );
    const contractsByAgencyId = Object.fromEntries(contractsEntries);
    const filteredAgencies = filterAgencies(agencies.content, filters.q);
    const activeAgencies = agencies.content.filter((agency) => agency.status === "active").length;
    const activeContracts = Object.values(contractsByAgencyId)
      .flat()
      .filter((contract) => contract.status === "active").length;

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Agences cash</h1>
          <p className="text-muted-foreground text-sm">
            Administrez les points d’agence et les agents autorises pour les operations cash-in/cash-out.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard icon={Building2} label="Agences" value={agencies.totalElements.toString()} />
          <MetricCard icon={Landmark} label="Actives" value={activeAgencies.toString()} />
          <MetricCard icon={UserRoundCheck} label="Agents cash" value={cashAgents.totalElements.toString()} />
          <MetricCard icon={ShieldCheck} label="Contrats actifs" value={activeContracts.toString()} />
        </div>

        <AgenciesAdminPanel
          agents={cashAgents.content}
          agencies={filteredAgencies}
          contractsByAgencyId={contractsByAgencyId}
          filters={filters}
        />
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Agences cash</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger les agences cash.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acces indisponible</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Le backend agence ne repond pas."}
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

function filterAgencies(agencies: Awaited<ReturnType<typeof listAgencies>>["content"], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return agencies;
  }

  return agencies.filter(
    (agency) =>
      agency.name.toLowerCase().includes(normalizedQuery) ||
      agency.agencyCode.toLowerCase().includes(normalizedQuery) ||
      agency.city?.toLowerCase().includes(normalizedQuery) ||
      agency.zone?.toLowerCase().includes(normalizedQuery),
  );
}
