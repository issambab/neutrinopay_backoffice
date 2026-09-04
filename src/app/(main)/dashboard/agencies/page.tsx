import type { ComponentType } from "react";

import { Building2, Landmark, ShieldCheck, UserRoundCheck, WalletCards } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAgencies, listAgencyAgents } from "@/lib/cash/cash.server";
import type { CashAgentContractResponse } from "@/lib/cash/cash.types";

import { AgenciesAdminPanel } from "./_components/agencies-admin-panel";

type AgenciesPageProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
    size?: string;
    sort?: string;
    status?: string;
  }>;
};

const PAGE_SIZE = 20;

export default async function AgenciesPage({ searchParams }: AgenciesPageProps) {
  const params = await searchParams;
  const page = toPageNumber(params?.page);
  const pageSize = toPageSize(params?.size);
  const sort = toAgencySort(params?.sort);
  const filters = {
    q: params?.q ?? "",
    status: params?.status ?? "",
  };

  try {
    const agencies = await listAgencies({
      page,
      q: filters.q || undefined,
      size: pageSize,
      sort,
      status: filters.status || undefined,
    });

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
    const pageActiveAgencies = agencies.content.filter((agency) => agency.status === "active").length;
    const pageContracts = Object.values(contractsByAgencyId).flat();
    const pageActiveContracts = pageContracts.filter((contract) => contract.status === "active").length;

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <div className="grid gap-5 border-b bg-muted/20 p-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:p-6">
            <div>
              <p className="font-medium text-muted-foreground text-sm">Cash network control</p>
              <h1 className="mt-1 font-semibold text-2xl tracking-tight md:text-3xl">Agences cash</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground text-sm">
                La liste sert au suivi. La creation et la gestion des agents se font dans un workflow dedie par agence.
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-sm">Contrats actifs page</p>
                  <p className="mt-1 font-semibold text-3xl tracking-tight">{pageActiveContracts}</p>
                </div>
                <WalletCards className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-3 border-t pt-3 text-muted-foreground text-xs">
                Ouvrez une agence pour modifier ses informations, affecter les agents et ajuster les commissions.
              </p>
            </div>
          </div>

          <div className="grid gap-3 p-4 md:grid-cols-4">
            <MetricCard icon={Building2} label="Agences" value={agencies.totalElements.toString()} />
            <MetricCard icon={Landmark} label="Actives page" value={pageActiveAgencies.toString()} />
            <MetricCard icon={UserRoundCheck} label="Agents page" value={pageContracts.length.toString()} />
            <MetricCard icon={ShieldCheck} label="Contrats actifs" value={pageActiveContracts.toString()} />
          </div>
        </section>

        <AgenciesAdminPanel
          agencies={agencies}
          contractsByAgencyId={contractsByAgencyId}
          filters={filters}
          pageSize={pageSize}
          sort={sort}
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

function toPageNumber(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function toPageSize(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : PAGE_SIZE;
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

  return value && allowedSorts.has(value) ? value : "createdAt,desc";
}
