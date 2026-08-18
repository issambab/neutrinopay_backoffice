"use client";

import type { ComponentType } from "react";
import { useEffect, useState, useTransition } from "react";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  ArrowUpDown,
  Building2,
  CheckCircle2,
  Eye,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CashAgentContractResponse, LifecycleStatus, PageResponse } from "@/lib/cash/cash.types";
import { cashStatusClassName, formatCashStatus, formatMinorAmount } from "@/lib/cash/cash-format";
import type { UserResponse } from "@/lib/iam/iam.types";
import { cn } from "@/lib/utils";

type AgentsFilters = {
  contractStatus: string;
  q: string;
  status: string;
};

type AgentsAdminPanelProps = {
  agents: PageResponse<UserResponse>;
  contractsByAgentId: Record<string, AgentContractSummary[]>;
  filters: AgentsFilters;
  pageSize: number;
  sort: string;
};

export type AgentContractSummary = CashAgentContractResponse & {
  agencyStatus: LifecycleStatus;
};

const PAGE_SIZES = [10, 20, 30, 50];
const USER_STATUSES = ["pending", "active", "suspended", "blocked", "closed"];
const CONTRACT_STATUSES: LifecycleStatus[] = ["pending", "active", "suspended", "blocked", "closed", "archived"];

export function AgentsAdminPanel({ agents, contractsByAgentId, filters, pageSize, sort }: AgentsAdminPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(filters.q);

  useEffect(() => {
    setSearchValue(filters.q);
  }, [filters.q]);

  function pushParams(updates: Record<string, string | number | null | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      const text = value == null ? "" : String(value);
      if (text.trim()) {
        params.set(key, text.trim());
      } else {
        params.delete(key);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  }

  function pushFilters(nextFilters: Partial<AgentsFilters>, nextPage = 0, nextSize = pageSize) {
    pushParams({
      contractStatus: nextFilters.contractStatus ?? filters.contractStatus,
      page: nextPage,
      q: nextFilters.q ?? filters.q,
      size: nextSize,
      sort,
      status: nextFilters.status ?? filters.status,
    });
  }

  function pushSort(sortKey: string) {
    const [currentKey, currentDirection] = parseSort(sort);
    const nextDirection = currentKey === sortKey && currentDirection === "asc" ? "desc" : "asc";
    pushParams({
      page: 0,
      size: pageSize,
      sort: `${sortKey},${nextDirection}`,
    });
  }

  function resetFilters() {
    setSearchValue("");
    router.push(pathname);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Liste des agents</CardTitle>
            <p className="mt-1 text-muted-foreground text-sm">
              Vue tenant-safe des agents cash, de leurs contrats agence et des parametres de commission.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/agencies">Gerer les affectations</Link>
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_12rem_12rem_10rem_auto]">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              pushFilters({ q: searchValue });
            }}
          >
            <div className="min-w-0 flex-1">
              <Label className="sr-only" htmlFor="agent-search">
                Recherche agent
              </Label>
              <Input
                id="agent-search"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Nom, email, telephone..."
                value={searchValue}
              />
            </div>
            <Button size="icon" type="submit" variant="outline">
              <Search className="size-4" />
              <span className="sr-only">Rechercher</span>
            </Button>
          </form>

          <NativeSelect value={filters.status} onChange={(event) => pushFilters({ status: event.target.value })}>
            <NativeSelectOption value="">Statut agent</NativeSelectOption>
            {USER_STATUSES.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {formatCashStatus(status)}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          <NativeSelect
            value={filters.contractStatus}
            onChange={(event) => pushFilters({ contractStatus: event.target.value })}
          >
            <NativeSelectOption value="">Statut contrat</NativeSelectOption>
            {CONTRACT_STATUSES.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {formatCashStatus(status)}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          <NativeSelect value={String(pageSize)} onChange={(event) => pushFilters({}, 0, Number(event.target.value))}>
            {PAGE_SIZES.map((size) => (
              <NativeSelectOption key={size} value={String(size)}>
                {size} / page
              </NativeSelectOption>
            ))}
          </NativeSelect>

          <Button onClick={resetFilters} type="button" variant="ghost">
            <RotateCcw className="size-4" />
            Reinitialiser
          </Button>
        </div>
      </CardHeader>

      <CardContent className="min-w-0 space-y-4">
        <div className="grid gap-3 lg:hidden">
          {agents.content.length === 0 ? (
            <div className="rounded-lg border p-6 text-center text-muted-foreground text-sm">
              Aucun agent cash ne correspond aux filtres.
            </div>
          ) : (
            agents.content.map((agent) => (
              <AgentMobileCard agent={agent} contracts={contractsByAgentId[agent.id] ?? []} key={agent.id} />
            ))
          )}
        </div>

        <div className="hidden min-w-0 rounded-lg border lg:block">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[18%] whitespace-normal">
                  <SortButton label="Agent" onClick={() => pushSort("fullName")} />
                </TableHead>
                <TableHead className="w-[11%] whitespace-normal">Statut</TableHead>
                <TableHead className="w-[18%] whitespace-normal">Contrat agence</TableHead>
                <TableHead>Activation réseau</TableHead>
                <TableHead className="w-[13%] whitespace-normal">Commission</TableHead>
                <TableHead className="w-[11%] whitespace-normal">Limites</TableHead>
                <TableHead className="w-[7%] whitespace-normal text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.content.length === 0 ? (
                <TableRow>
                  <TableCell className="h-32 text-center text-muted-foreground" colSpan={7}>
                    Aucun agent cash ne correspond aux filtres.
                  </TableCell>
                </TableRow>
              ) : (
                agents.content.map((agent) => (
                  <AgentRow agent={agent} contracts={contractsByAgentId[agent.id] ?? []} key={agent.id} />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
          <p className="text-muted-foreground text-sm">
            Page {agents.totalPages === 0 ? 0 : agents.page + 1} sur {agents.totalPages} - {agents.totalElements} agents
          </p>
          <Pagination className="mx-0 justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  aria-disabled={agents.first}
                  className={cn(agents.first && "pointer-events-none opacity-50")}
                  href={pageHref(searchParams, agents.page - 1)}
                  text="Precedent"
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  aria-disabled={agents.last}
                  className={cn(agents.last && "pointer-events-none opacity-50")}
                  href={pageHref(searchParams, agents.page + 1)}
                  text="Suivant"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentRow({ agent, contracts }: { agent: UserResponse; contracts: AgentContractSummary[] }) {
  const primaryContract = contracts.find((contract) => contract.status === "active") ?? contracts[0];
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, startTransition] = useTransition();
  const agentReady = agent.status === "active";
  const agencyReady = primaryContract?.agencyStatus === "active";
  const contractReady = primaryContract?.status === "active";
  const networkReady = agentReady && agencyReady && contractReady;

  function activateNetworkPart(part: "agency" | "agent" | "contract") {
    if (part !== "agent" && !primaryContract) {
      setError("Aucun contrat agence n'est rattache a cet agent.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const response = await fetch(activationUrl(part, agent, primaryContract), {
        body: JSON.stringify({ status: "active" }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(body?.message ?? "Activation impossible.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="whitespace-normal">
        <div className="min-w-0">
          <p className="break-words font-medium">
            {agent.fullName ?? agent.email ?? agent.phoneNumber ?? "Agent cash"}
          </p>
          <p className="break-all text-muted-foreground text-xs">{agent.email ?? agent.phoneNumber ?? agent.id}</p>
          <p className="mt-1 break-all text-muted-foreground text-xs">Ref: {agent.externalReference ?? agent.id}</p>
        </div>
      </TableCell>
      <TableCell className="whitespace-normal">
        <div className="flex flex-col gap-1">
          <Badge className={cashStatusClassName(agent.status)} variant="outline">
            {formatCashStatus(agent.status)}
          </Badge>
          <span className="text-muted-foreground text-xs">KYC {formatCashStatus(agent.kycStatus)}</span>
        </div>
      </TableCell>
      <TableCell className="whitespace-normal">
        {primaryContract ? (
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className={cashStatusClassName(primaryContract.status)} variant="outline">
                {formatCashStatus(primaryContract.status)}
              </Badge>
              <Badge className={cashStatusClassName(primaryContract.agencyStatus)} variant="outline">
                Agence {formatCashStatus(primaryContract.agencyStatus)}
              </Badge>
            </div>
            <div>
              <p className="break-words font-medium text-sm">{primaryContract.agencyName}</p>
              <p className="break-all text-muted-foreground text-xs">{primaryContract.agencyCode}</p>
            </div>
          </div>
        ) : (
          <Badge variant="outline">Sans contrat</Badge>
        )}
      </TableCell>
      <TableCell className="whitespace-normal">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <ReadinessBadge label="Agent" ready={agentReady} />
            <ReadinessBadge label="Agence" ready={agencyReady} />
            <ReadinessBadge label="Contrat" ready={contractReady} />
          </div>
          {networkReady ? (
            <div className="flex items-center gap-2 text-emerald-700 text-xs">
              <CheckCircle2 className="size-3.5" />
              Pret Cash-in/Cash-out
            </div>
          ) : (
            <div className="grid gap-1.5 xl:grid-cols-2">
              {!agentReady && (
                <Button
                  className="justify-start px-2 text-xs"
                  disabled={pendingAction}
                  onClick={() => activateNetworkPart("agent")}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {pendingAction ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Activer agent
                </Button>
              )}
              {primaryContract && !agencyReady && (
                <Button
                  className="justify-start px-2 text-xs"
                  disabled={pendingAction}
                  onClick={() => activateNetworkPart("agency")}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {pendingAction ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Activer agence
                </Button>
              )}
              {primaryContract && !contractReady && (
                <Button
                  className="justify-start px-2 text-xs"
                  disabled={pendingAction}
                  onClick={() => activateNetworkPart("contract")}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {pendingAction ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Activer contrat
                </Button>
              )}
            </div>
          )}
          {error ? <p className="break-words text-destructive text-xs">{error}</p> : null}
        </div>
      </TableCell>
      <TableCell className="whitespace-normal">
        {primaryContract ? (
          <div className="grid gap-2 text-sm">
            <InlineMetric
              icon={SlidersHorizontal}
              label="Agent"
              value={`${formatPercent(primaryContract.commissionValue)}`}
            />
            <InlineMetric
              icon={ShieldCheck}
              label="Plateforme"
              value={`${formatPercent(primaryContract.platformCommissionSharePercent)}`}
            />
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Non configuree</span>
        )}
      </TableCell>
      <TableCell className="whitespace-normal">
        {primaryContract ? (
          <div className="grid gap-1 text-sm">
            <span>Jour {formatMinorAmount(primaryContract.dailyLimitMinor)}</span>
            <span className="text-muted-foreground">Mois {formatMinorAmount(primaryContract.monthlyLimitMinor)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell className="whitespace-normal text-right">
        <div className="flex justify-end gap-2">
          {primaryContract ? (
            <Button asChild className="px-2" size="sm" variant="outline">
              <Link href={`/dashboard/agencies?q=${encodeURIComponent(primaryContract.agencyCode)}`}>
                <Eye className="size-4" />
                <span className="sr-only xl:not-sr-only">Contrat</span>
              </Link>
            </Button>
          ) : (
            <Button asChild className="px-2" size="sm" variant="outline">
              <Link href="/dashboard/agencies">
                <Building2 className="size-4" />
                <span className="sr-only xl:not-sr-only">Affecter</span>
              </Link>
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function AgentMobileCard({ agent, contracts }: { agent: UserResponse; contracts: AgentContractSummary[] }) {
  const primaryContract = contracts.find((contract) => contract.status === "active") ?? contracts[0];
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, startTransition] = useTransition();
  const agentReady = agent.status === "active";
  const agencyReady = primaryContract?.agencyStatus === "active";
  const contractReady = primaryContract?.status === "active";
  const networkReady = agentReady && agencyReady && contractReady;

  function activateNetworkPart(part: "agency" | "agent" | "contract") {
    if (part !== "agent" && !primaryContract) {
      setError("Aucun contrat agence n'est rattache a cet agent.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const response = await fetch(activationUrl(part, agent, primaryContract), {
        body: JSON.stringify({ status: "active" }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(body?.message ?? "Activation impossible.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="min-w-0 space-y-4 rounded-lg border bg-background p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-medium">
            {agent.fullName ?? agent.email ?? agent.phoneNumber ?? "Agent cash"}
          </p>
          <p className="break-all text-muted-foreground text-xs">{agent.email ?? agent.phoneNumber ?? agent.id}</p>
        </div>
        <Badge className={cashStatusClassName(agent.status)} variant="outline">
          {formatCashStatus(agent.status)}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Contrat agence</p>
          {primaryContract ? (
            <>
              <p className="break-words font-medium text-sm">{primaryContract.agencyName}</p>
              <p className="break-all text-muted-foreground text-xs">{primaryContract.agencyCode}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge className={cashStatusClassName(primaryContract.status)} variant="outline">
                  {formatCashStatus(primaryContract.status)}
                </Badge>
                <Badge className={cashStatusClassName(primaryContract.agencyStatus)} variant="outline">
                  Agence {formatCashStatus(primaryContract.agencyStatus)}
                </Badge>
              </div>
            </>
          ) : (
            <Badge variant="outline">Sans contrat</Badge>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Commission</p>
          {primaryContract ? (
            <div className="grid gap-1 text-sm">
              <span>Agent {formatPercent(primaryContract.commissionValue)}</span>
              <span className="text-muted-foreground">
                Plateforme {formatPercent(primaryContract.platformCommissionSharePercent)}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">Non configuree</span>
          )}
        </div>
      </div>

      <div className="space-y-2 border-t pt-3">
        <div className="flex flex-wrap gap-1.5">
          <ReadinessBadge label="Agent" ready={agentReady} />
          <ReadinessBadge label="Agence" ready={agencyReady} />
          <ReadinessBadge label="Contrat" ready={contractReady} />
        </div>
        {networkReady ? (
          <div className="flex items-center gap-2 text-emerald-700 text-xs">
            <CheckCircle2 className="size-3.5" />
            Pret Cash-in/Cash-out
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            {!agentReady && (
              <Button
                disabled={pendingAction}
                onClick={() => activateNetworkPart("agent")}
                size="sm"
                type="button"
                variant="outline"
              >
                {pendingAction ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Activer agent
              </Button>
            )}
            {primaryContract && !agencyReady && (
              <Button
                disabled={pendingAction}
                onClick={() => activateNetworkPart("agency")}
                size="sm"
                type="button"
                variant="outline"
              >
                {pendingAction ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Activer agence
              </Button>
            )}
            {primaryContract && !contractReady && (
              <Button
                disabled={pendingAction}
                onClick={() => activateNetworkPart("contract")}
                size="sm"
                type="button"
                variant="outline"
              >
                {pendingAction ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Activer contrat
              </Button>
            )}
          </div>
        )}
        {error ? <p className="break-words text-destructive text-xs">{error}</p> : null}
      </div>

      <div className="flex justify-end border-t pt-3">
        {primaryContract ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/agencies?q=${encodeURIComponent(primaryContract.agencyCode)}`}>
              <Eye className="size-4" />
              Contrat
            </Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/agencies">
              <Building2 className="size-4" />
              Affecter
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function InlineMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <Separator className="mx-1 h-3" orientation="vertical" />
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ReadinessBadge({ label, ready }: { label: string; ready?: boolean }) {
  return (
    <Badge
      className={cn(
        ready ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700",
      )}
      variant="outline"
    >
      {label} {ready ? "actif" : "a activer"}
    </Badge>
  );
}

function activationUrl(part: "agency" | "agent" | "contract", agent: UserResponse, contract?: AgentContractSummary) {
  if (part === "agent") {
    return `/api/iam/users/${agent.id}`;
  }

  if (!contract) {
    throw new Error("Contract is required for agency or contract activation.");
  }

  if (part === "agency") {
    return `/api/cash/agencies/${contract.agencyId}/status`;
  }

  return `/api/cash/agencies/${contract.agencyId}/agents/${contract.id}/status`;
}

function SortButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button className="h-auto px-0 font-medium" onClick={onClick} type="button" variant="ghost">
      {label}
      <ArrowUpDown className="size-3.5" />
    </Button>
  );
}

function formatPercent(value?: number | null) {
  return `${Number(value ?? 0).toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}%`;
}

function parseSort(sort: string) {
  const [key = "createdAt", direction = "desc"] = sort.split(",");
  return [key, direction] as const;
}

function pageHref(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams(searchParams.toString());
  params.set("page", String(Math.max(page, 0)));
  return `?${params.toString()}`;
}
