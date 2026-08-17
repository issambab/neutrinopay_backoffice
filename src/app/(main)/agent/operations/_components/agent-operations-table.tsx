"use client";

import { useRouter } from "next/navigation";

import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CashOperationResponse, PageResponse } from "@/lib/cash/cash.types";
import {
  cashStatusClassName,
  formatCashOperationType,
  formatCashStatus,
  formatMinorAmount,
} from "@/lib/cash/cash-format";
import { cn } from "@/lib/utils";

type AgentOperationsTableProps = {
  operations: PageResponse<CashOperationResponse>;
  pageSize: number;
  sort: string;
};

const PAGE_SIZES = [10, 20, 30, 40, 50];

export function AgentOperationsTable({ operations, pageSize, sort }: AgentOperationsTableProps) {
  const router = useRouter();

  function pushPage(nextPage: number, nextSize = pageSize, nextSort = sort) {
    const searchParams = new URLSearchParams();
    searchParams.set("page", String(Math.max(nextPage, 0)));
    searchParams.set("size", String(nextSize));
    searchParams.set("sort", nextSort);

    router.push(`/agent/operations?${searchParams.toString()}`);
  }

  function pushSort(sortKey: string) {
    const [currentKey, currentDirection] = parseSort(sort);
    const nextDirection = currentKey === sortKey && currentDirection === "asc" ? "desc" : "asc";
    pushPage(0, pageSize, `${sortKey},${nextDirection}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-sm">Historique agent</p>
          <p className="text-muted-foreground text-sm">
            {operations.content.length} ligne(s) affichee(s) sur {operations.totalElements}.
          </p>
        </div>
        <Button disabled size="sm" variant="outline" className="w-full justify-start md:w-fit">
          <ArrowUpDown className="size-4" />
          {formatSortLabel(sort)}
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/15">
            <TableRow>
              <TableHead className="w-[150px]">
                <SortableHeader currentSort={sort} label="Operation" onSort={pushSort} sortKey="operationType" />
              </TableHead>
              <TableHead>Client</TableHead>
              <TableHead>
                <SortableHeader currentSort={sort} label="Statut" onSort={pushSort} sortKey="status" />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader currentSort={sort} label="Flux cash" onSort={pushSort} sortKey="amountMinor" />
              </TableHead>
              <TableHead>Commissions</TableHead>
              <TableHead className="text-right">
                <SortableHeader currentSort={sort} label="Date" onSort={pushSort} sortKey="createdAt" />
              </TableHead>
              <TableHead className="w-[64px] text-right">Ledger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operations.content.length ? (
              operations.content.map((operation) => <AgentOperationRow key={operation.id} operation={operation} />)
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Aucune operation cash rattachee a votre caisse pour le moment.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
          Page {operations.page + 1} sur {Math.max(operations.totalPages, 1)}
        </div>
        <div className="flex w-full items-center gap-6 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="agent-operations-rows-per-page" className="font-medium text-sm">
              Lignes
            </Label>
            <Select value={`${pageSize}`} onValueChange={(value) => pushPage(0, Number(value))}>
              <SelectTrigger size="sm" className="w-20" id="agent-operations-rows-per-page">
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
            {operations.page + 1} / {Math.max(operations.totalPages, 1)}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <PaginationIconButton disabled={operations.first} onClick={() => pushPage(0)}>
              <span className="sr-only">Aller a la premiere page</span>
              <ChevronsLeft className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton disabled={operations.first} onClick={() => pushPage(operations.page - 1)}>
              <span className="sr-only">Aller a la page precedente</span>
              <ChevronLeft className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton disabled={operations.last} onClick={() => pushPage(operations.page + 1)}>
              <span className="sr-only">Aller a la page suivante</span>
              <ChevronRight className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton disabled={operations.last} onClick={() => pushPage(operations.totalPages - 1)}>
              <span className="sr-only">Aller a la derniere page</span>
              <ChevronsRight className="size-4" />
            </PaginationIconButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentOperationRow({ operation }: { operation: CashOperationResponse }) {
  const breakdown = cashBreakdown(operation);

  return (
    <TableRow>
      <TableCell>
        <div className="grid gap-1">
          <span className="font-medium text-sm">{formatCashOperationType(operation.operationType)}</span>
          <span className="font-mono text-muted-foreground text-xs">{shortId(operation.id)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="grid gap-1">
          <span className="font-medium text-sm">{operation.customerName ?? "Client"}</span>
          <span className="font-mono text-muted-foreground text-xs">{shortId(operation.customerWalletId)}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={cn("px-1.5", cashStatusClassName(operation.status))} variant="outline">
          {formatCashStatus(operation.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-medium">
        <div className="grid gap-1">
          {operation.operationType === "cash_in" ? (
            <>
              <span>{formatMinorAmount(breakdown.customerNetMinor, operation.currency)}</span>
              <span className="text-muted-foreground text-xs">
                Net client · brut recu {formatMinorAmount(breakdown.grossMinor, operation.currency)}
              </span>
            </>
          ) : (
            <>
              <span>{formatMinorAmount(breakdown.grossMinor, operation.currency)}</span>
              <span className="text-muted-foreground text-xs">
                Cash remis Â· debit total{" "}
                {formatMinorAmount(breakdown.grossMinor + breakdown.commissionMinor, operation.currency)}
              </span>
            </>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="grid gap-1">
          {operation.commissionAmountMinor ? (
            <>
              <span className="text-muted-foreground text-xs">
                Total {formatMinorAmount(breakdown.commissionMinor, operation.currency)}
              </span>
              <span className="text-muted-foreground text-xs">
                Agent {formatMinorAmount(breakdown.agentCommissionMinor, operation.currency)} · Plateforme{" "}
                {formatMinorAmount(breakdown.platformCommissionMinor, operation.currency)}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground text-xs">Aucune commission</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right text-muted-foreground text-xs">{formatDateTime(operation.createdAt)}</TableCell>
      <TableCell className="text-right">
        <Button
          title={operation.ledgerTransactionId ? `Ledger ${operation.ledgerTransactionId}` : "Operation non postee"}
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={!operation.ledgerTransactionId}
        >
          <span className="sr-only">Reference ledger</span>
          <ExternalLink className="size-4" />
        </Button>
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
      operationType: "Type",
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

function cashBreakdown(operation: CashOperationResponse) {
  const grossMinor = operation.grossAmountMinor ?? operation.amountMinor;
  const customerNetMinor = operation.customerNetAmountMinor ?? operation.amountMinor;
  const commissionMinor = operation.commissionAmountMinor ?? Math.max(grossMinor - customerNetMinor, 0);
  const agentCommissionMinor = operation.agentCommissionAmountMinor ?? commissionMinor;
  const platformCommissionMinor = operation.platformCommissionAmountMinor ?? 0;

  return {
    agentCommissionMinor,
    commissionMinor,
    customerNetMinor,
    grossMinor,
    platformCommissionMinor,
  };
}
