"use client";

import type { ComponentType } from "react";
import { useEffect, useState, useTransition } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  ArrowUpDown,
  Banknote,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Eye,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Send,
  UsersRound,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type {
  AgencyResponse,
  AgentLedgerBalanceResponse,
  AgentPayoutResponse,
  AgentPayoutStatus,
  CashAgentContractResponse,
  PageResponse,
} from "@/lib/cash/cash.types";
import { cashStatusClassName, formatCashStatus, formatMinorAmount } from "@/lib/cash/cash-format";
import { cn } from "@/lib/utils";

type PayoutFilters = {
  agencyId: string;
  agencyQ: string;
  agencyStatus: string;
  agentUserId: string;
  payoutId: string;
  q: string;
  status: string;
};

type AgencyFilters = {
  q: string;
  status: string;
};

type AgentPayoutsPanelProps = {
  agencies: PageResponse<AgencyResponse>;
  agencyPageSize: number;
  agencySort: string;
  contractsByAgencyId: Record<string, CashAgentContractResponse[]>;
  filters: PayoutFilters;
  pageSize: number;
  payouts: PageResponse<AgentPayoutResponse>;
  selectedPayout: AgentPayoutResponse | null;
  sort: string;
};

const PAGE_SIZES = [10, 20, 30, 40, 50];
const AGENCY_STATUSES = ["draft", "pending", "active", "suspended", "blocked", "closed", "archived"];
const PAYOUT_STATUSES: AgentPayoutStatus[] = ["pending", "posted", "failed", "rejected"];

export function AgentPayoutsPanel({
  agencies,
  agencyPageSize,
  agencySort,
  contractsByAgencyId,
  filters,
  pageSize,
  payouts,
  selectedPayout,
  sort,
}: AgentPayoutsPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [agencySearchValue, setAgencySearchValue] = useState(filters.agencyQ);
  const [searchValue, setSearchValue] = useState(filters.q);

  useEffect(() => {
    setAgencySearchValue(filters.agencyQ);
  }, [filters.agencyQ]);

  useEffect(() => {
    setSearchValue(filters.q);
  }, [filters.q]);

  const selectedAgency = agencies.content.find((agency) => agency.id === filters.agencyId) ?? null;
  const selectedAgencyId = selectedAgency?.id ?? "";
  const agencyContracts = selectedAgencyId ? (contractsByAgencyId[selectedAgencyId] ?? []) : [];
  const selectedContract = agencyContracts.find((contract) => contract.agentUserId === filters.agentUserId) ?? null;

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

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function pushAgencyListParams(
    nextFilters: Partial<AgencyFilters>,
    nextPage = 0,
    nextSize = agencyPageSize,
    nextSort = agencySort,
  ) {
    pushParams({
      agencyId: null,
      agencyPage: nextPage,
      agencyQ: nextFilters.q ?? filters.agencyQ,
      agencySize: nextSize,
      agencySort: nextSort,
      agencyStatus: nextFilters.status ?? filters.agencyStatus,
      agentUserId: null,
      page: 0,
      payoutId: null,
      q: null,
      status: null,
    });
  }

  function pushAgencySort(sortKey: string) {
    const [currentKey, currentDirection] = parseSort(agencySort);
    const nextDirection = currentKey === sortKey && currentDirection === "asc" ? "desc" : "asc";
    pushAgencyListParams({}, 0, agencyPageSize, `${sortKey},${nextDirection}`);
  }

  function resetAgencyFilters() {
    setAgencySearchValue("");
    router.push(pathname, { scroll: false });
  }

  function onAgencySearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushAgencyListParams({ q: agencySearchValue });
  }

  function pushAgency(agencyId: string) {
    pushParams({
      agencyId,
      agentUserId: null,
      page: 0,
      payoutId: null,
      q: null,
      status: null,
    });
  }

  function pushAgent(contract: CashAgentContractResponse) {
    pushParams({
      agencyId: contract.agencyId,
      agentUserId: contract.agentUserId,
      page: 0,
      payoutId: null,
    });
  }

  function pushFilters(nextFilters: Partial<PayoutFilters>, nextPage = 0, nextSize = pageSize) {
    pushParams({
      agencyId: nextFilters.agencyId ?? selectedAgencyId,
      agentUserId: nextFilters.agentUserId ?? selectedContract?.agentUserId,
      page: nextPage,
      payoutId: nextFilters.payoutId ?? filters.payoutId,
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
      agencyId: selectedAgencyId,
      agentUserId: selectedContract?.agentUserId,
      page: 0,
      payoutId: filters.payoutId,
      size: pageSize,
      sort: `${sortKey},${nextDirection}`,
    });
  }

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushFilters({ q: searchValue, payoutId: "" });
  }

  return (
    <div className="grid gap-4">
      <AgencyRail
        agencies={agencies}
        agencyPageSize={agencyPageSize}
        agencySearchValue={agencySearchValue}
        agencySort={agencySort}
        contractsByAgencyId={contractsByAgencyId}
        filters={{ q: filters.agencyQ, status: filters.agencyStatus }}
        onPageChange={(nextPage) => pushAgencyListParams({}, nextPage)}
        onPageSizeChange={(nextSize) => pushAgencyListParams({}, 0, nextSize)}
        onReset={resetAgencyFilters}
        onSearchChange={setAgencySearchValue}
        onSearchSubmit={onAgencySearchSubmit}
        onSelectAgency={pushAgency}
        onSort={pushAgencySort}
        onStatusChange={(status) => pushAgencyListParams({ status })}
        selectedAgencyId={selectedAgencyId}
      />

      {selectedAgency ? (
        <AgentRail
          agency={selectedAgency}
          contracts={agencyContracts}
          onSelectAgent={pushAgent}
          selectedAgentUserId={selectedContract?.agentUserId ?? ""}
        />
      ) : null}

      {selectedAgency && !selectedContract ? (
        <FlowPlaceholder
          icon={Banknote}
          title="Payouts agent"
          description="Cliquer sur un agent dans le tableau pour afficher son historique payout."
        />
      ) : null}

      {selectedAgency && selectedContract ? (
        <AgentPayoutWorkspace
          agency={selectedAgency}
          contract={selectedContract}
          filters={filters}
          onPageChange={(nextPage) => pushFilters({}, nextPage)}
          onPageSizeChange={(nextSize) => pushFilters({}, 0, nextSize)}
          onSearchSubmit={onSearchSubmit}
          onSelectPayout={(payoutId) => pushFilters({ payoutId }, payouts.page)}
          onSort={pushSort}
          pageSize={pageSize}
          payouts={payouts}
          searchValue={searchValue}
          selectedPayout={selectedPayout}
          setSearchValue={setSearchValue}
          sort={sort}
          status={filters.status}
          onStatusChange={(status) => pushFilters({ status, payoutId: "" })}
        />
      ) : null}
    </div>
  );
}

function AgencyRail({
  agencies,
  agencyPageSize,
  agencySearchValue,
  agencySort,
  contractsByAgencyId,
  filters,
  onPageChange,
  onPageSizeChange,
  onReset,
  onSearchChange,
  onSearchSubmit,
  onSelectAgency,
  onSort,
  onStatusChange,
  selectedAgencyId,
}: {
  agencies: PageResponse<AgencyResponse>;
  agencyPageSize: number;
  agencySearchValue: string;
  agencySort: string;
  contractsByAgencyId: Record<string, CashAgentContractResponse[]>;
  filters: AgencyFilters;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onReset: () => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSelectAgency: (agencyId: string) => void;
  onSort: (sortKey: string) => void;
  onStatusChange: (status: string) => void;
  selectedAgencyId: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Liste des agences</CardTitle>
            <p className="mt-1 text-muted-foreground text-sm">Choisir une agence pour afficher ses agents rattaches.</p>
          </div>
          <Button asChild variant="outline">
            <a href="/dashboard/agencies">Gerer les agences</a>
          </Button>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={onSearchSubmit} className="relative w-full lg:w-96">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pr-16 pl-8"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Nom, code, ville..."
                value={agencySearchValue}
              />
              <Button
                className="absolute top-1/2 right-1 h-6 -translate-y-1/2 px-2"
                size="sm"
                type="submit"
                variant="ghost"
              >
                OK
              </Button>
            </form>
            <NativeSelect
              className="h-8 w-full sm:w-48"
              onChange={(event) => onStatusChange(event.target.value)}
              value={filters.status}
            >
              <NativeSelectOption value="">Tous statuts</NativeSelectOption>
              {AGENCY_STATUSES.map((status) => (
                <NativeSelectOption key={status} value={status}>
                  {formatCashStatus(status)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button onClick={onReset} type="button" variant="outline" size="sm">
              <RotateCcw />
              Reset
            </Button>
            <Button disabled size="sm" variant="outline">
              <ArrowUpDown />
              {formatAgencySortLabel(agencySort)}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-w-0 space-y-4">
        <div className="grid gap-3 lg:hidden">
          {agencies.content.length === 0 ? (
            <div className="rounded-lg border p-6 text-center text-muted-foreground text-sm">
              Aucune agence ne correspond aux filtres.
            </div>
          ) : (
            agencies.content.map((agency) => (
              <AgencyMobileCard
                agency={agency}
                contractsCount={(contractsByAgencyId[agency.id] ?? []).length}
                isSelected={agency.id === selectedAgencyId}
                key={agency.id}
                onSelectAgency={onSelectAgency}
              />
            ))
          )}
        </div>

        <div className="hidden min-w-0 overflow-hidden rounded-md border bg-card lg:block">
          <Table>
            <TableHeader className="bg-muted/15">
              <TableRow>
                <TableHead className="w-[220px]">
                  <SortableHeader currentSort={agencySort} label="Agence" onSort={onSort} sortKey="name" />
                </TableHead>
                <TableHead>
                  <SortableHeader currentSort={agencySort} label="Code" onSort={onSort} sortKey="agencyCode" />
                </TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>
                  <SortableHeader currentSort={agencySort} label="Statut" onSort={onSort} sortKey="status" />
                </TableHead>
                <TableHead className="text-right">Agents</TableHead>
                <TableHead className="text-right">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agencies.content.length ? (
                agencies.content.map((agency) => (
                  <AgencyRow
                    agency={agency}
                    contractsCount={(contractsByAgencyId[agency.id] ?? []).length}
                    isSelected={agency.id === selectedAgencyId}
                    key={agency.id}
                    onSelectAgency={onSelectAgency}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Aucune agence ne correspond aux filtres.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <AgencyPaginationBar
          agencies={agencies}
          agencyPageSize={agencyPageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </CardContent>
    </Card>
  );
}

function AgencyRow({
  agency,
  contractsCount,
  isSelected,
  onSelectAgency,
}: {
  agency: AgencyResponse;
  contractsCount: number;
  isSelected: boolean;
  onSelectAgency: (agencyId: string) => void;
}) {
  return (
    <TableRow className={cn("cursor-pointer", isSelected && "bg-muted/35")} onClick={() => onSelectAgency(agency.id)}>
      <TableCell>
        <div className="grid gap-1">
          <span className="truncate font-medium">{agency.name}</span>
          <span className="font-mono text-muted-foreground text-xs">{shortId(agency.id)}</span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-muted-foreground text-xs">{agency.agencyCode}</TableCell>
      <TableCell>
        <div className="grid gap-1">
          <span className="truncate text-sm">{agency.city ?? agency.region ?? "-"}</span>
          <span className="text-muted-foreground text-xs">{agency.countryCode ?? agency.zone ?? "-"}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="grid max-w-72 gap-1">
          <span className="truncate text-sm">{agency.contactEmail ?? "-"}</span>
          <span className="truncate text-muted-foreground text-xs">{agency.contactPhone ?? "-"}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={cashStatusClassName(agency.status)} variant="outline">
          {formatCashStatus(agency.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Badge variant="outline">{contractsCount} actif(s)</Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            onClick={(event) => {
              event.stopPropagation();
              onSelectAgency(agency.id);
            }}
            size="icon-sm"
            type="button"
            variant={isSelected ? "default" : "ghost"}
          >
            <UsersRound className="size-4" />
            <span className="sr-only">Afficher les agents</span>
          </Button>
          <Button asChild size="icon-sm" variant="ghost" onClick={(event) => event.stopPropagation()}>
            <a href={`/dashboard/agencies?q=${encodeURIComponent(agency.agencyCode)}`}>
              <Eye className="size-4" />
              <span className="sr-only">Ouvrir l'agence</span>
            </a>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function AgencyMobileCard({
  agency,
  contractsCount,
  isSelected,
  onSelectAgency,
}: {
  agency: AgencyResponse;
  contractsCount: number;
  isSelected: boolean;
  onSelectAgency: (agencyId: string) => void;
}) {
  return (
    <div className={cn("grid gap-3 rounded-lg border p-4", isSelected ? "border-primary bg-primary/5" : "bg-card")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-medium">{agency.name}</p>
          <p className="break-all text-muted-foreground text-xs">{agency.agencyCode}</p>
        </div>
        <Badge className={cashStatusClassName(agency.status)} variant="outline">
          {formatCashStatus(agency.status)}
        </Badge>
      </div>
      <div className="grid gap-1 text-muted-foreground text-sm">
        <span>{agency.city ?? agency.region ?? "-"}</span>
        <span className="break-all text-xs">{agency.contactEmail ?? agency.contactPhone ?? "-"}</span>
        <span className="text-xs">{contractsCount} agent(s) actif(s)</span>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          className="px-2"
          onClick={() => onSelectAgency(agency.id)}
          size="sm"
          type="button"
          variant={isSelected ? "default" : "outline"}
        >
          <UsersRound className="size-4" />
          Agents
        </Button>
        <Button asChild className="px-2" size="sm" variant="outline">
          <a href={`/dashboard/agencies?q=${encodeURIComponent(agency.agencyCode)}`}>
            <Eye className="size-4" />
            Ouvrir
          </a>
        </Button>
      </div>
    </div>
  );
}

function AgencyPaginationBar({
  agencies,
  agencyPageSize,
  onPageChange,
  onPageSizeChange,
}: {
  agencies: PageResponse<AgencyResponse>;
  agencyPageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
        {agencies.content.length} ligne(s) affichee(s) sur {agencies.totalElements}.
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="agencies-rows-per-page" className="font-medium text-sm">
            Rows per page
          </Label>
          <Select value={`${agencyPageSize}`} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger size="sm" className="w-20" id="agencies-rows-per-page">
              <SelectValue placeholder={agencyPageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectGroup>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center font-medium text-sm">
          Page {agencies.page + 1} of {Math.max(agencies.totalPages, 1)}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <PaginationIconButton disabled={agencies.first} onClick={() => onPageChange(0)}>
            <span className="sr-only">Aller a la premiere page</span>
            <ChevronsLeft className="size-4" />
          </PaginationIconButton>
          <PaginationIconButton disabled={agencies.first} onClick={() => onPageChange(agencies.page - 1)}>
            <span className="sr-only">Page precedente</span>
            <ChevronLeft className="size-4" />
          </PaginationIconButton>
          <PaginationIconButton disabled={agencies.last} onClick={() => onPageChange(agencies.page + 1)}>
            <span className="sr-only">Page suivante</span>
            <ChevronRight className="size-4" />
          </PaginationIconButton>
          <PaginationIconButton
            disabled={agencies.last}
            onClick={() => onPageChange(Math.max(agencies.totalPages - 1, 0))}
          >
            <span className="sr-only">Aller a la derniere page</span>
            <ChevronsRight className="size-4" />
          </PaginationIconButton>
        </div>
      </div>
    </div>
  );
}
function AgentRail({
  agency,
  contracts,
  onSelectAgent,
  selectedAgentUserId,
}: {
  agency: AgencyResponse | null;
  contracts: CashAgentContractResponse[];
  onSelectAgent: (contract: CashAgentContractResponse) => void;
  selectedAgentUserId: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3 border-b">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="size-5" />
            Tableau agents
          </CardTitle>
          <p className="mt-1 text-muted-foreground text-sm">
            {agency?.name ?? "Selectionner une agence"} - cliquer sur un agent pour afficher ses payouts.
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/15">
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Limites</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-[160px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length ? (
              contracts.map((contract) => {
                const isSelected = contract.agentUserId === selectedAgentUserId;
                return (
                  <TableRow
                    key={contract.id}
                    className={cn("cursor-pointer", isSelected && "bg-primary/5")}
                    onClick={() => onSelectAgent(contract)}
                  >
                    <TableCell>
                      <div className="grid gap-1">
                        <span className="font-medium">{agentDisplayName(contract)}</span>
                        <span className="font-mono text-muted-foreground text-xs">{shortId(contract.id)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {contract.agentEmail ?? contract.agentPhoneNumber ?? contract.agentUserId}
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <span>{formatCommission(contract)}</span>
                        <span className="text-muted-foreground text-xs">{contract.commissionMode}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      <div className="grid gap-1">
                        <span>Jour: {formatOptionalLimit(contract.dailyLimitMinor)}</span>
                        <span>Mois: {formatOptionalLimit(contract.monthlyLimitMinor)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cashStatusClassName(contract.status)} variant="outline">
                        {formatCashStatus(contract.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectAgent(contract);
                        }}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                      >
                        <Banknote />
                        Payouts
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Aucun agent actif sur cette agence.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
function AgentPayoutWorkspace({
  agency,
  contract,
  filters,
  onPageChange,
  onPageSizeChange,
  onSearchSubmit,
  onSelectPayout,
  onSort,
  onStatusChange,
  pageSize,
  payouts,
  searchValue,
  selectedPayout,
  setSearchValue,
  sort,
  status,
}: {
  agency: AgencyResponse | null;
  contract: CashAgentContractResponse | null;
  filters: PayoutFilters;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSelectPayout: (payoutId: string) => void;
  onSort: (sortKey: string) => void;
  onStatusChange: (status: string) => void;
  pageSize: number;
  payouts: PageResponse<AgentPayoutResponse>;
  searchValue: string;
  selectedPayout: AgentPayoutResponse | null;
  setSearchValue: (value: string) => void;
  sort: string;
  status: string;
}) {
  const [earningsBalance, setEarningsBalance] = useState<AgentLedgerBalanceResponse | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  useEffect(() => {
    if (!contract?.id) {
      setEarningsBalance(null);
      setBalanceError(null);
      return;
    }

    const controller = new AbortController();
    setEarningsBalance(null);
    setBalanceError(null);
    setIsBalanceLoading(true);

    fetch(`/api/cash/agent-payouts/earnings-balance?agentContractId=${encodeURIComponent(contract.id)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as {
          balance?: AgentLedgerBalanceResponse;
          message?: string;
        } | null;

        if (!response.ok || !body?.balance) {
          throw new Error(body?.message ?? "Impossible de charger le solde earnings.");
        }

        setEarningsBalance(body.balance);
      })
      .catch((fetchError) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }
        setBalanceError(fetchError instanceof Error ? fetchError.message : "Impossible de charger le solde earnings.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsBalanceLoading(false);
        }
      });

    return () => controller.abort();
  }, [contract?.id]);

  if (!agency || !contract) {
    return (
      <Card className="min-h-[28rem]">
        <CardContent className="flex h-full min-h-[28rem] items-center justify-center text-center text-muted-foreground text-sm">
          Selectionner une agence, puis cliquer sur un agent pour afficher ses payouts et creer une operation.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="gap-3 border-b">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="size-5" />
                Tableau payouts
              </CardTitle>
              <p className="mt-1 text-muted-foreground text-sm">
                {agentDisplayName(contract)} - {agency.agencyCode}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={`/dashboard/agencies?q=${encodeURIComponent(agency.agencyCode)}`}>
                  <Edit />
                  Modifier agence
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={`/dashboard/agents?q=${encodeURIComponent(agentDisplayName(contract))}`}>
                  <UsersRound />
                  Profil agent
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-3">
              <FactTile label="Agence" value={agency.name} />
              <FactTile label="Contrat" value={shortId(contract.id)} />
              <FactTile label="Commission" value={formatCommission(contract)} />
            </div>
            <div className="rounded-md border bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-sm">Earnings disponible</span>
                <span className="font-semibold">
                  {isBalanceLoading
                    ? "Chargement..."
                    : earningsBalance
                      ? formatMinorAmount(earningsBalance.balanceMinor, earningsBalance.currency)
                      : "-"}
                </span>
              </div>
              <p className="mt-2 break-all font-mono text-muted-foreground text-xs">
                {earningsBalance?.accountAddress ?? "agents:{code}:earnings"}
              </p>
              {balanceError ? <p className="mt-2 text-destructive text-xs">{balanceError}</p> : null}
            </div>
          </div>
          <CreatePayoutForAgentForm balance={earningsBalance} contract={contract} isBalanceLoading={isBalanceLoading} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3 border-b">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Operations payout</CardTitle>
              <p className="mt-1 text-muted-foreground text-sm">Historique filtre sur l'agent selectionne.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button asChild variant="outline" size="sm">
                <a
                  href={`/dashboard/agent-payouts?agencyId=${encodeURIComponent(filters.agencyId)}&agentUserId=${encodeURIComponent(filters.agentUserId)}`}
                >
                  <RotateCcw />
                  Reset
                </a>
              </Button>
              <Button disabled size="sm" variant="outline">
                <ArrowUpDown />
                {formatSortLabel(sort)}
              </Button>
            </div>
          </div>
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_170px]">
            <form onSubmit={onSearchSubmit} className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pr-16 pl-8"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Preuve, ledger..."
                value={searchValue}
              />
              <Button
                className="absolute top-1/2 right-1 h-6 -translate-y-1/2 px-2"
                size="sm"
                type="submit"
                variant="ghost"
              >
                OK
              </Button>
            </form>
            <NativeSelect className="h-8" onChange={(event) => onStatusChange(event.target.value)} value={status}>
              <NativeSelectOption value="">Tous statuts</NativeSelectOption>
              {PAYOUT_STATUSES.map((payoutStatus) => (
                <NativeSelectOption key={payoutStatus} value={payoutStatus}>
                  {formatCashStatus(payoutStatus)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <PayoutTable
            onSelect={onSelectPayout}
            onSort={onSort}
            payouts={payouts}
            selectedPayoutId={selectedPayout?.id ?? ""}
            sort={sort}
          />
          <PaginationBar
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSize={pageSize}
            payouts={payouts}
          />
        </CardContent>
      </Card>

      <PayoutDecisionCard selectedPayout={selectedPayout} />
    </div>
  );
}

function CreatePayoutForAgentForm({
  balance,
  contract,
  isBalanceLoading,
}: {
  balance: AgentLedgerBalanceResponse | null;
  contract: CashAgentContractResponse;
  isBalanceLoading: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canSubmit = balance != null && !isBalanceLoading && !isPending;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const amountMinor = dinarToMinor(formData.get("amount"));

    if (!balance) {
      setError("Le solde earnings doit etre disponible avant creation du payout.");
      return;
    }

    if (!amountMinor || amountMinor <= 0) {
      setError("Le montant doit etre strictement positif.");
      return;
    }

    if (amountMinor > balance.balanceMinor) {
      setError(
        `Montant superieur aux earnings disponibles (${formatMinorAmount(balance.balanceMinor, balance.currency)}).`,
      );
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/cash/agent-payouts", {
        body: JSON.stringify({
          agentContractId: contract.id,
          amountMinor,
          currency: "TND",
          metadata: {
            channel: "backoffice",
            workflow: "agency_agent_cockpit",
          },
          proofReference: nullableText(formData.get("proofReference")),
          reason: nullableText(formData.get("reason")),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(body?.message ?? "Impossible de creer le payout.");
        return;
      }

      form.reset();
      router.refresh();
    });
  }

  return (
    <form className="grid gap-3 rounded-md border bg-card p-3" onSubmit={onSubmit}>
      <div className="flex items-center gap-2">
        <Plus className="size-4 text-muted-foreground" />
        <span className="font-medium text-sm">Nouveau payout</span>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="amount">Montant TND</Label>
        <Input id="amount" name="amount" inputMode="decimal" placeholder="500.000" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="proofReference">Reference paiement</Label>
        <Input id="proofReference" name="proofReference" placeholder="PAYOUT-AG-001" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="reason">Motif</Label>
        <Textarea id="reason" name="reason" rows={3} placeholder="Paiement commission agent" />
      </div>
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive text-sm">{error}</p>
      ) : null}
      <Button disabled={!canSubmit} type="submit">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Creer payout
      </Button>
    </form>
  );
}

function PayoutTable({
  onSelect,
  onSort,
  payouts,
  selectedPayoutId,
  sort,
}: {
  onSelect: (payoutId: string) => void;
  onSort: (sortKey: string) => void;
  payouts: PageResponse<AgentPayoutResponse>;
  selectedPayoutId: string;
  sort: string;
}) {
  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <Table>
        <TableHeader className="bg-muted/15">
          <TableRow>
            <TableHead>
              <SortableHeader currentSort={sort} label="Date" onSort={onSort} sortKey="createdAt" />
            </TableHead>
            <TableHead>
              <SortableHeader currentSort={sort} label="Statut" onSort={onSort} sortKey="status" />
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader currentSort={sort} label="Montant" onSort={onSort} sortKey="amountMinor" />
            </TableHead>
            <TableHead>Preuve</TableHead>
            <TableHead>Ledger</TableHead>
            <TableHead className="w-[88px] text-right">Detail</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payouts.content.length ? (
            payouts.content.map((payout) => (
              <TableRow key={payout.id} className={cn(payout.id === selectedPayoutId && "bg-muted/35")}>
                <TableCell>
                  <div className="grid gap-1">
                    <span className="font-medium text-sm">{formatDateTime(payout.createdAt)}</span>
                    <span className="font-mono text-muted-foreground text-xs">{shortId(payout.id)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("px-1.5", cashStatusClassName(payout.status))} variant="outline">
                    {formatCashStatus(payout.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatMinorAmount(payout.amountMinor, payout.currency)}
                </TableCell>
                <TableCell className="font-mono text-muted-foreground text-xs">
                  {payout.proofReference || "-"}
                </TableCell>
                <TableCell>
                  <div className="grid gap-1">
                    <span className="font-mono text-muted-foreground text-xs">
                      {payout.ledgerTransactionId ? shortId(payout.ledgerTransactionId) : "-"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {payout.paidAt ? formatDateTime(payout.paidAt) : "Non paye"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <PayoutDetailSheet onOpen={() => onSelect(payout.id)} payout={payout} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Aucun payout pour cet agent.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function PayoutDecisionCard({ selectedPayout }: { selectedPayout: AgentPayoutResponse | null }) {
  if (!selectedPayout) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Decision finance</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">Aucun payout selectionne.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Decision finance</CardTitle>
            <p className="mt-1 font-mono text-muted-foreground text-xs">{shortId(selectedPayout.id)}</p>
          </div>
          <Badge className={cn("px-1.5", cashStatusClassName(selectedPayout.status))} variant="outline">
            {formatCashStatus(selectedPayout.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <DetailLine label="Montant" value={formatMinorAmount(selectedPayout.amountMinor, selectedPayout.currency)} />
          <DetailLine label="Preuve" value={selectedPayout.proofReference || "-"} />
          <DetailLine label="Source" value={selectedPayout.sourceAccount} mono />
          <DetailLine label="Destination" value={selectedPayout.destinationAccount} mono />
          <DetailLine label="Ledger" value={selectedPayout.ledgerTransactionId || "-"} mono />
          <DetailLine label="Creation" value={formatDateTime(selectedPayout.createdAt)} />
          {selectedPayout.paidAt ? <DetailLine label="Paiement" value={formatDateTime(selectedPayout.paidAt)} /> : null}
          {selectedPayout.failedAt ? (
            <DetailLine label="Echec" value={formatDateTime(selectedPayout.failedAt)} />
          ) : null}
          {selectedPayout.rejectedAt ? (
            <DetailLine label="Rejet" value={formatDateTime(selectedPayout.rejectedAt)} />
          ) : null}
          {selectedPayout.failureReason ? <DetailLine label="Erreur" value={selectedPayout.failureReason} /> : null}
          {selectedPayout.rejectionReason ? (
            <DetailLine label="Motif rejet" value={selectedPayout.rejectionReason} />
          ) : null}
          {selectedPayout.reason ? <DetailLine label="Motif" value={selectedPayout.reason} /> : null}
        </div>

        {selectedPayout.status === "pending" || selectedPayout.status === "failed" ? (
          <>
            <Separator />
            <ApprovePayoutForm payout={selectedPayout} />
          </>
        ) : null}
        {selectedPayout.status === "pending" ? (
          <>
            <Separator />
            <RejectPayoutForm payout={selectedPayout} />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PayoutDetailSheet({ onOpen, payout }: { onOpen: () => void; payout: AgentPayoutResponse }) {
  const metadataEntries = Object.entries(payout.metadata ?? {});

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" onClick={onOpen}>
          <Eye />
          Voir
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Detail payout agent</SheetTitle>
          <SheetDescription>{payout.proofReference ?? payout.ledgerTransactionId ?? payout.id}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-4 pb-4">
          <div className="grid gap-3 rounded-md border bg-muted/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge className={cn("px-1.5", cashStatusClassName(payout.status))} variant="outline">
                {formatCashStatus(payout.status)}
              </Badge>
              <span className="font-semibold text-lg">{formatMinorAmount(payout.amountMinor, payout.currency)}</span>
            </div>
            <Separator />
            <div className="grid gap-3 md:grid-cols-2">
              <DetailFact label="Payout" value={payout.id} mono />
              <DetailFact label="Ledger transaction" value={payout.ledgerTransactionId ?? "-"} mono />
              <DetailFact label="Preuve" value={payout.proofReference ?? "-"} mono />
              <DetailFact label="Date creation" value={formatDateTime(payout.createdAt)} />
              <DetailFact label="Date paiement" value={payout.paidAt ? formatDateTime(payout.paidAt) : "-"} />
              <DetailFact label="Cle idempotence" value={payout.idempotencyKey ?? "-"} mono />
              <DetailFact label="Compte source" value={payout.sourceAccount} mono />
              <DetailFact label="Compte destination" value={payout.destinationAccount} mono />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Metadata payout / ledger</h3>
              <Badge variant="outline" className="text-muted-foreground">
                {metadataEntries.length} champs
              </Badge>
            </div>
            {metadataEntries.length ? (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableBody>
                    {metadataEntries.map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="w-[180px] align-top font-mono text-muted-foreground text-xs">
                          {key}
                        </TableCell>
                        <TableCell className="whitespace-normal break-all text-sm">
                          {formatMetadataValue(value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
                Aucune metadata disponible pour ce payout.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ApprovePayoutForm({ payout }: { payout: AgentPayoutResponse }) {
  const router = useRouter();
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIdempotencyKey(`agent-payout-${payout.id}-${Date.now()}`);
  }, [payout.id]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/cash/agent-payouts/${payout.id}/approve`, {
        body: JSON.stringify({ idempotencyKey }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(body?.message ?? "Impossible d'approuver le payout.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="idempotencyKey">Cle d'idempotence</Label>
        <Input
          id="idempotencyKey"
          onChange={(event) => setIdempotencyKey(event.target.value)}
          value={idempotencyKey}
          required
        />
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button disabled={isPending || !idempotencyKey.trim()} type="submit">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Accepter et payer
      </Button>
    </form>
  );
}

function RejectPayoutForm({ payout }: { payout: AgentPayoutResponse }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const reason = nullableText(formData.get("rejectReason"));

    if (!reason) {
      setError("Le motif de rejet est obligatoire.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/cash/agent-payouts/${payout.id}/reject`, {
        body: JSON.stringify({ reason }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(body?.message ?? "Impossible de rejeter le payout.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="rejectReason">Motif de rejet</Label>
        <Textarea id="rejectReason" name="rejectReason" rows={3} required />
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button disabled={isPending} type="submit" variant="outline">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
        Refuser
      </Button>
    </form>
  );
}

function PaginationBar({
  onPageChange,
  onPageSizeChange,
  pageSize,
  payouts,
}: {
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSize: number;
  payouts: PageResponse<AgentPayoutResponse>;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p className="text-muted-foreground text-sm">
        {payouts.content.length} ligne(s) affichee(s) sur {payouts.totalElements}.
      </p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="agent-payouts-rows-per-page" className="font-medium text-sm">
            Lignes
          </Label>
          <NativeSelect
            className="h-8 w-20"
            id="agent-payouts-rows-per-page"
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            value={String(pageSize)}
          >
            {PAGE_SIZES.map((size) => (
              <NativeSelectOption key={size} value={String(size)}>
                {size}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex items-center gap-1">
          <PaginationIconButton disabled={payouts.first} onClick={() => onPageChange(0)}>
            <ChevronsLeft className="size-4" />
          </PaginationIconButton>
          <PaginationIconButton disabled={payouts.first} onClick={() => onPageChange(Math.max(payouts.page - 1, 0))}>
            <ChevronLeft className="size-4" />
          </PaginationIconButton>
          <span className="min-w-16 text-center text-muted-foreground text-sm">
            {payouts.page + 1} / {Math.max(payouts.totalPages, 1)}
          </span>
          <PaginationIconButton disabled={payouts.last} onClick={() => onPageChange(payouts.page + 1)}>
            <ChevronRight className="size-4" />
          </PaginationIconButton>
          <PaginationIconButton
            disabled={payouts.last}
            onClick={() => onPageChange(Math.max(payouts.totalPages - 1, 0))}
          >
            <ChevronsRight className="size-4" />
          </PaginationIconButton>
        </div>
      </div>
    </div>
  );
}

function PaginationIconButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button disabled={disabled} onClick={onClick} size="icon-sm" type="button" variant="outline">
      {children}
    </Button>
  );
}

function SortableHeader({
  currentSort,
  label,
  onSort,
  sortKey,
}: {
  currentSort: string;
  label: string;
  onSort: (sortKey: string) => void;
  sortKey: string;
}) {
  const [currentKey, currentDirection] = parseSort(currentSort);
  const active = currentKey === sortKey;
  return (
    <Button
      className="h-auto gap-1 px-0 py-0 font-medium text-muted-foreground hover:text-foreground"
      onClick={() => onSort(sortKey)}
      size="sm"
      type="button"
      variant="ghost"
    >
      {label}
      <ArrowUpDown className={cn("size-3.5", active && "text-foreground")} />
      {active ? <span className="sr-only">tri {currentDirection}</span> : null}
    </Button>
  );
}

function FlowPlaceholder({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <Card className="h-fit min-h-64 border-dashed">
      <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-10 items-center justify-center rounded-md border bg-muted/25">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="mt-1 max-w-64 text-muted-foreground text-sm">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FactTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 truncate font-medium text-sm">{value}</p>
    </div>
  );
}

function DetailLine({ label, mono, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn("break-words font-medium", mono && "break-all font-mono text-xs")}>{value}</span>
    </div>
  );
}

function DetailFact({ label, mono, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn("break-words text-sm", mono && "break-all font-mono text-xs")}>{value}</span>
    </div>
  );
}

function agentDisplayName(contract: CashAgentContractResponse) {
  return contract.agentName ?? contract.agentEmail ?? contract.agentPhoneNumber ?? contract.agentUserId;
}

function formatOptionalLimit(value?: number | null) {
  return value == null ? "-" : formatMinorAmount(value);
}

function formatCommission(contract: CashAgentContractResponse) {
  if (contract.commissionMode === "percent") {
    return `${contract.commissionValue}%`;
  }
  if (contract.commissionMode === "fixed") {
    return formatMinorAmount(contract.commissionValue);
  }
  return "Tiered";
}

function formatAgencySortLabel(sort: string) {
  const [key, direction] = parseSort(sort);
  const labels: Record<string, string> = {
    agencyCode: "Code",
    createdAt: "Creation",
    name: "Agence",
    status: "Statut",
  };
  return `${labels[key] ?? key} ${direction}`;
}

function formatSortLabel(sort: string) {
  const [key, direction] = parseSort(sort);
  const labels: Record<string, string> = {
    amountMinor: "Montant",
    createdAt: "Creation",
    paidAt: "Paiement",
    status: "Statut",
  };
  return `${labels[key] ?? key} ${direction}`;
}

function parseSort(sort: string) {
  const [key = "createdAt", direction = "desc"] = sort.split(",");
  return [key, direction] as const;
}

function dinarToMinor(value: FormDataEntryValue | null) {
  const raw = String(value ?? "")
    .replace(",", ".")
    .trim();
  if (!raw) {
    return 0;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.round(parsed * 100);
}

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function shortId(value: string) {
  return value.length <= 12 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("fr-TN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMetadataValue(value: unknown) {
  if (value == null) {
    return "-";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}
