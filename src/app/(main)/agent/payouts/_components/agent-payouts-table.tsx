"use client";

import { useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AgentPayoutResponse, AgentPayoutStatus, PageResponse } from "@/lib/cash/cash.types";
import { cashStatusClassName, formatCashStatus, formatMinorAmount } from "@/lib/cash/cash-format";
import { cn } from "@/lib/utils";

type AgentPayoutsFilters = {
  q: string;
  status: string;
};

type AgentPayoutsTableProps = {
  filters: AgentPayoutsFilters;
  pageSize: number;
  payouts: PageResponse<AgentPayoutResponse>;
  sort: string;
};

const PAGE_SIZES = [10, 20, 30, 40, 50];
const PAYOUT_STATUSES: AgentPayoutStatus[] = ["pending", "posted", "rejected", "failed"];

export function AgentPayoutsTable({ filters, pageSize, payouts, sort }: AgentPayoutsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(filters.q);

  useEffect(() => {
    setSearchValue(filters.q);
  }, [filters.q]);

  function pushFilters(nextFilters: Partial<AgentPayoutsFilters>, nextPage = 0, nextSize = pageSize, nextSort = sort) {
    const params = new URLSearchParams(searchParams.toString());
    const merged = {
      q: nextFilters.q ?? filters.q,
      status: nextFilters.status ?? filters.status,
    };
    params.set("page", String(nextPage));
    params.set("size", String(nextSize));
    params.set("sort", nextSort);

    Object.entries(merged).forEach(([key, value]) => {
      if (value.trim()) {
        params.set(key, value.trim());
      } else {
        params.delete(key);
      }
    });

    router.push(`/agent/payouts?${params.toString()}`);
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
    <div className="grid gap-4">
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_170px]">
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
        <NativeSelect
          className="h-8"
          onChange={(event) => pushFilters({ status: event.target.value })}
          value={filters.status}
        >
          <NativeSelectOption value="">Tous statuts</NativeSelectOption>
          {PAYOUT_STATUSES.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {formatCashStatus(status)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/15">
            <TableRow>
              <TableHead>
                <SortableHeader currentSort={sort} label="Creation" onSort={pushSort} sortKey="createdAt" />
              </TableHead>
              <TableHead>
                <SortableHeader currentSort={sort} label="Statut" onSort={pushSort} sortKey="status" />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader currentSort={sort} label="Montant" onSort={pushSort} sortKey="amountMinor" />
              </TableHead>
              <TableHead>Preuve</TableHead>
              <TableHead>Comptes</TableHead>
              <TableHead>
                <SortableHeader currentSort={sort} label="Paiement" onSort={pushSort} sortKey="paidAt" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.content.length ? (
              payouts.content.map((payout) => <AgentPayoutRow key={payout.id} payout={payout} />)
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Aucun payout ne correspond aux filtres.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
              onChange={(event) => pushFilters({}, 0, Number(event.target.value))}
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
            <PaginationIconButton disabled={payouts.first} onClick={() => pushFilters({}, 0)}>
              <ChevronsLeft className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton disabled={payouts.first} onClick={() => pushFilters({}, payouts.page - 1)}>
              <ChevronLeft className="size-4" />
            </PaginationIconButton>
            <span className="min-w-16 text-center text-muted-foreground text-sm">
              {payouts.page + 1} / {Math.max(payouts.totalPages, 1)}
            </span>
            <PaginationIconButton disabled={payouts.last} onClick={() => pushFilters({}, payouts.page + 1)}>
              <ChevronRight className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton disabled={payouts.last} onClick={() => pushFilters({}, payouts.totalPages - 1)}>
              <ChevronsRight className="size-4" />
            </PaginationIconButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentPayoutRow({ payout }: { payout: AgentPayoutResponse }) {
  return (
    <TableRow>
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
      <TableCell className="text-right font-medium">{formatMinorAmount(payout.amountMinor, payout.currency)}</TableCell>
      <TableCell>
        <div className="grid gap-1">
          <span className="font-medium text-sm">{payout.proofReference ?? payout.reason ?? "Payout"}</span>
          <span className="font-mono text-muted-foreground text-xs">
            {payout.ledgerTransactionId ? shortId(payout.ledgerTransactionId) : "Ledger non poste"}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="grid gap-1">
          <span className="break-all font-mono text-muted-foreground text-xs">{payout.sourceAccount}</span>
          <span className="break-all text-muted-foreground text-xs">vers {payout.destinationAccount}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="grid gap-1">
          <span className="text-sm">{payout.paidAt ? formatDateTime(payout.paidAt) : "-"}</span>
          {payout.failureReason ? <span className="text-orange-700 text-xs">{payout.failureReason}</span> : null}
          {payout.rejectionReason ? (
            <span className="text-muted-foreground text-xs">{payout.rejectionReason}</span>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
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

function parseSort(sort: string) {
  const [key = "createdAt", direction = "desc"] = sort.split(",");
  return [key, direction] as const;
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
