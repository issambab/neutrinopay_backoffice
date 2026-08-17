"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RotateCcw, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AgentFloatTopupResponse, AgentFloatTopupStatus, PageResponse } from "@/lib/cash/cash.types";
import { cashStatusClassName, formatCashStatus, formatMinorAmount } from "@/lib/cash/cash-format";
import { cn } from "@/lib/utils";

type AgentFloatTopupsFilters = {
  q: string;
  status: string;
};

type AgentFloatTopupsTableProps = {
  filters: AgentFloatTopupsFilters;
  pageSize: number;
  sort: string;
  topups: PageResponse<AgentFloatTopupResponse>;
};

const PAGE_SIZES = [10, 20, 30, 40, 50];
const TOPUP_STATUSES: AgentFloatTopupStatus[] = ["pending", "posted", "rejected", "failed"];

export function AgentFloatTopupsTable({ filters, pageSize, sort, topups }: AgentFloatTopupsTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(filters.q);

  useEffect(() => {
    setSearchValue(filters.q);
  }, [filters.q]);

  function pushFilters(
    nextFilters: Partial<AgentFloatTopupsFilters>,
    nextPage = 0,
    nextSize = pageSize,
    nextSort = sort,
  ) {
    const searchParams = new URLSearchParams();
    const merged = { ...filters, ...nextFilters };
    searchParams.set("page", String(Math.max(nextPage, 0)));
    searchParams.set("size", String(nextSize));
    searchParams.set("sort", nextSort);
    appendIfPresent(searchParams, "q", merged.q);
    appendIfPresent(searchParams, "status", merged.status);

    router.push(`/agent/float-topups?${searchParams.toString()}`);
  }

  function pushSort(sortKey: string) {
    const [currentKey, currentDirection] = parseSort(sort);
    const nextDirection = currentKey === sortKey && currentDirection === "asc" ? "desc" : "asc";
    pushFilters({}, 0, pageSize, `${sortKey},${nextDirection}`);
  }

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushFilters({ q: searchValue });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={onSearchSubmit} className="relative w-full lg:w-96">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 pr-16 pl-8"
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Reference, ledger, motif..."
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
          <NativeSelect
            className="h-8 w-full sm:w-48"
            onChange={(event) => pushFilters({ status: event.target.value })}
            value={filters.status}
          >
            <NativeSelectOption value="">Tous statuts</NativeSelectOption>
            {TOPUP_STATUSES.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {formatCashStatus(status)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start md:w-fit"
            onClick={() => pushFilters({ q: "", status: "" })}
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <Button disabled size="sm" variant="outline" className="w-full justify-start md:w-fit">
            <ArrowUpDown className="size-4" />
            {formatSortLabel(sort)}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/15">
            <TableRow>
              <TableHead className="w-[160px]">
                <SortableHeader currentSort={sort} label="Demande" onSort={pushSort} sortKey="createdAt" />
              </TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>
                <SortableHeader currentSort={sort} label="Statut" onSort={pushSort} sortKey="status" />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader currentSort={sort} label="Montant" onSort={pushSort} sortKey="amountMinor" />
              </TableHead>
              <TableHead>Comptes ledger</TableHead>
              <TableHead className="text-right">
                <SortableHeader currentSort={sort} label="Posting" onSort={pushSort} sortKey="postedAt" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topups.content.length ? (
              topups.content.map((topup) => <AgentFloatTopupRow key={topup.id} topup={topup} />)
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Aucune alimentation float ne correspond aux filtres.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
          {topups.content.length} ligne(s) affichee(s) sur {topups.totalElements}.
        </div>
        <div className="flex w-full items-center gap-6 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="agent-float-topups-rows-per-page" className="font-medium text-sm">
              Lignes
            </Label>
            <Select value={`${pageSize}`} onValueChange={(value) => pushFilters({}, 0, Number(value))}>
              <SelectTrigger size="sm" className="w-20" id="agent-float-topups-rows-per-page">
                <SelectValue placeholder={pageSize} />
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
            {topups.page + 1} / {Math.max(topups.totalPages, 1)}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <PaginationIconButton disabled={topups.first} onClick={() => pushFilters({}, 0)}>
              <span className="sr-only">Aller a la premiere page</span>
              <ChevronsLeft className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton disabled={topups.first} onClick={() => pushFilters({}, topups.page - 1)}>
              <span className="sr-only">Aller a la page precedente</span>
              <ChevronLeft className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton disabled={topups.last} onClick={() => pushFilters({}, topups.page + 1)}>
              <span className="sr-only">Aller a la page suivante</span>
              <ChevronRight className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton disabled={topups.last} onClick={() => pushFilters({}, topups.totalPages - 1)}>
              <span className="sr-only">Aller a la derniere page</span>
              <ChevronsRight className="size-4" />
            </PaginationIconButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentFloatTopupRow({ topup }: { topup: AgentFloatTopupResponse }) {
  return (
    <TableRow>
      <TableCell>
        <div className="grid gap-1">
          <span className="font-medium text-sm">{formatDateTime(topup.createdAt)}</span>
          <span className="font-mono text-muted-foreground text-xs">{shortId(topup.id)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="grid gap-1">
          <span className="font-medium text-sm">{topup.proofReference ?? topup.reason ?? "Recharge float"}</span>
          <span className="font-mono text-muted-foreground text-xs">
            {topup.ledgerTransactionId ? shortId(topup.ledgerTransactionId) : "Ledger non poste"}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={cn("px-1.5", cashStatusClassName(topup.status))} variant="outline">
          {formatCashStatus(topup.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-medium">{formatMinorAmount(topup.amountMinor, topup.currency)}</TableCell>
      <TableCell>
        <div className="grid gap-1">
          <span className="break-all font-mono text-muted-foreground text-xs">{topup.sourceAccount}</span>
          <span className="break-all font-mono text-muted-foreground text-xs">vers {topup.destinationAccount}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="grid gap-1">
          <span className="text-muted-foreground text-xs">{topup.postedAt ? formatDateTime(topup.postedAt) : "-"}</span>
          {topup.failureReason ? <span className="text-orange-700 text-xs">{topup.failureReason}</span> : null}
        </div>
      </TableCell>
    </TableRow>
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
  const [currentKey] = parseSort(currentSort);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 h-7 px-2 font-medium"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <ArrowUpDown className={cn("size-3.5", currentKey === sortKey ? "text-foreground" : "text-muted-foreground")} />
    </Button>
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
    <Button variant="outline" className="size-8" size="icon" onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
}

function appendIfPresent(searchParams: URLSearchParams, key: string, value: string) {
  if (value.trim()) {
    searchParams.set(key, value.trim());
  }
}

function parseSort(sort: string) {
  const [key = "createdAt", direction = "desc"] = sort.split(",");
  return [key, direction] as const;
}

function formatSortLabel(sort: string) {
  const [key, direction] = parseSort(sort);
  const label =
    {
      amountMinor: "Montant",
      createdAt: "Creation",
      postedAt: "Posting",
      status: "Statut",
    }[key] ?? "Creation";

  return `${label}, ${direction === "asc" ? "asc" : "desc"}`;
}

function shortId(value: string) {
  return value.length > 13 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
