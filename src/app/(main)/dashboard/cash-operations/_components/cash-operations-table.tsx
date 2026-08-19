"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowDownLeft,
  ArrowUpDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  RotateCcw,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CashOperationResponse, PageResponse } from "@/lib/cash/cash.types";
import {
  cashStatusClassName,
  formatCashOperationType,
  formatCashStatus,
  formatMinorAmount,
} from "@/lib/cash/cash-format";
import { cn } from "@/lib/utils";

type CashOperationsFilters = {
  operationType: string;
  q: string;
  status: string;
};

type CashOperationsTableProps = {
  filters: CashOperationsFilters;
  operations: PageResponse<CashOperationResponse>;
  pageSize: number;
  sort: string;
};

const OPERATION_TYPES = ["cash_in", "cash_out"];
const OPERATION_STATUSES = ["otp_pending", "prepared", "posted", "failed", "cancelled", "expired"];
const PAGE_SIZES = [10, 20, 30, 40, 50];

export function CashOperationsTable({ filters, operations, pageSize, sort }: CashOperationsTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(filters.q);

  useEffect(() => {
    setSearchValue(filters.q);
  }, [filters.q]);

  function pushFilters(nextFilters: Partial<CashOperationsFilters>, nextPage = 0, nextSize = pageSize) {
    const searchParams = new URLSearchParams();
    const merged = { ...filters, ...nextFilters };
    searchParams.set("page", String(nextPage));
    searchParams.set("size", String(nextSize));
    appendIfPresent(searchParams, "sort", sort);
    appendIfPresent(searchParams, "q", merged.q);
    appendIfPresent(searchParams, "operationType", merged.operationType);
    appendIfPresent(searchParams, "status", merged.status);

    router.push(`/dashboard/cash-operations?${searchParams.toString()}`);
  }

  function pushSort(sortKey: string) {
    const [currentKey, currentDirection] = parseSort(sort);
    const nextDirection = currentKey === sortKey && currentDirection === "asc" ? "desc" : "asc";
    const searchParams = new URLSearchParams();
    searchParams.set("page", "0");
    searchParams.set("size", String(pageSize));
    searchParams.set("sort", `${sortKey},${nextDirection}`);
    appendIfPresent(searchParams, "q", filters.q);
    appendIfPresent(searchParams, "operationType", filters.operationType);
    appendIfPresent(searchParams, "status", filters.status);

    router.push(`/dashboard/cash-operations?${searchParams.toString()}`);
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
              placeholder="Client, agent, agence, ledger..."
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
            className="h-8 w-full sm:w-44"
            onChange={(event) => pushFilters({ operationType: event.target.value })}
            value={filters.operationType}
          >
            <NativeSelectOption value="">Tous types</NativeSelectOption>
            {OPERATION_TYPES.map((type) => (
              <NativeSelectOption key={type} value={type}>
                {formatCashOperationType(type)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            className="h-8 w-full sm:w-48"
            onChange={(event) => pushFilters({ status: event.target.value })}
            value={filters.status}
          >
            <NativeSelectOption value="">Tous statuts</NativeSelectOption>
            {OPERATION_STATUSES.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {formatCashStatus(status)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/cash-operations">
              <RotateCcw />
              Reset
            </Link>
          </Button>
          <Button disabled size="sm" variant="outline">
            <ArrowUpDown />
            {formatSortLabel(sort)}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/15">
            <TableRow>
              <TableHead className="w-[170px]">
                <SortableHeader currentSort={sort} label="Operation" onSort={pushSort} sortKey="operationType" />
              </TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Agence / agent</TableHead>
              <TableHead>
                <SortableHeader currentSort={sort} label="Statut" onSort={pushSort} sortKey="status" />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader currentSort={sort} label="Montant" onSort={pushSort} sortKey="amountMinor" />
              </TableHead>
              <TableHead>Ledger</TableHead>
              <TableHead className="text-right">
                <SortableHeader currentSort={sort} label="Date" onSort={pushSort} sortKey="createdAt" />
              </TableHead>
              <TableHead className="w-[96px] text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operations.content.length ? (
              operations.content.map((operation) => <CashOperationRow key={operation.id} operation={operation} />)
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Aucune operation cash ne correspond aux filtres.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
          {operations.content.length} ligne(s) affichee(s) sur {operations.totalElements}.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="cash-operations-rows-per-page" className="font-medium text-sm">
              Rows per page
            </Label>
            <Select value={`${pageSize}`} onValueChange={(value) => pushFilters({}, 0, Number(value))}>
              <SelectTrigger size="sm" className="w-20" id="cash-operations-rows-per-page">
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
            Page {operations.page + 1} of {Math.max(operations.totalPages, 1)}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <PaginationIconButton disabled={operations.first} onClick={() => pushFilters({}, 0)}>
              <span className="sr-only">Aller a la premiere page</span>
              <ChevronsLeft className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton
              disabled={operations.first}
              onClick={() => pushFilters({}, Math.max(operations.page - 1, 0))}
            >
              <span className="sr-only">Aller a la page precedente</span>
              <ChevronLeft className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton disabled={operations.last} onClick={() => pushFilters({}, operations.page + 1)}>
              <span className="sr-only">Aller a la page suivante</span>
              <ChevronRight className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton
              disabled={operations.last}
              onClick={() => pushFilters({}, Math.max(operations.totalPages - 1, 0))}
            >
              <span className="sr-only">Aller a la derniere page</span>
              <ChevronsRight className="size-4" />
            </PaginationIconButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function CashOperationRow({ operation }: { operation: CashOperationResponse }) {
  return (
    <TableRow>
      <TableCell>
        <div className="grid gap-1">
          <span className="font-medium text-sm">{formatCashOperationType(operation.operationType)}</span>
          <span className="font-mono text-muted-foreground text-xs">{shortId(operation.id)}</span>
        </div>
      </TableCell>
      <TableCell>
        <Link href={`/dashboard/users/${operation.customerUserId}`} className="grid gap-1 hover:underline">
          <span className="font-medium text-sm">{operation.customerName ?? "Client"}</span>
          <span className="font-mono text-muted-foreground text-xs">{shortId(operation.customerWalletId)}</span>
        </Link>
      </TableCell>
      <TableCell>
        <div className="grid gap-1">
          <span className="text-sm">{operation.agencyCode}</span>
          <span className="font-mono text-muted-foreground text-xs">{shortId(operation.agentUserId)}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={cn("px-1.5", cashStatusClassName(operation.status))} variant="outline">
          {formatCashStatus(operation.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatMinorAmount(operation.amountMinor, operation.currency)}
      </TableCell>
      <TableCell>
        <div className="grid gap-1">
          <span className="font-mono text-muted-foreground text-xs">
            {operation.ledgerTransactionId ? shortId(operation.ledgerTransactionId) : "-"}
          </span>
          <span className="text-muted-foreground text-xs">
            {operation.postedAt ? formatDateTime(operation.postedAt) : "Non postee"}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right text-muted-foreground text-xs">{formatDateTime(operation.createdAt)}</TableCell>
      <TableCell className="text-right">
        <CashOperationDetailSheet operation={operation} />
      </TableCell>
    </TableRow>
  );
}

function CashOperationDetailSheet({ operation }: { operation: CashOperationResponse }) {
  const metadataEntries = Object.entries(operation.metadata ?? {});

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye />
          Voir
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Detail transaction cash</SheetTitle>
          <SheetDescription>{operation.ledgerTransactionId ?? operation.id}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-4 pb-4">
          <div className="grid gap-3 rounded-md border bg-muted/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CashOperationDirectionBadge operationType={operation.operationType} status={operation.status} />
              <span className="font-semibold text-lg">{formatSignedAmount(operation)}</span>
            </div>
            <Separator />
            <div className="grid gap-3 md:grid-cols-2">
              <DetailFact label="Operation" value={formatCashOperationType(operation.operationType)} />
              <DetailFact label="Statut" value={formatCashStatus(operation.status)} />
              <DetailFact label="Operation cash" value={operation.id} mono />
              <DetailFact label="Ledger transaction" value={operation.ledgerTransactionId ?? "-"} mono />
              <DetailFact label="Wallet client" value={operation.customerWalletId} mono />
              <DetailFact label="Date creation" value={formatDateTime(operation.createdAt)} />
              <DetailFact
                label="Preparee le"
                value={operation.preparedAt ? formatDateTime(operation.preparedAt) : "-"}
              />
              <DetailFact label="Postee le" value={operation.postedAt ? formatDateTime(operation.postedAt) : "-"} />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Parties operationnelles</h3>
              <Badge variant="outline" className="font-mono text-[11px] text-muted-foreground">
                {operation.agencyCode}
              </Badge>
            </div>
            <div className="grid gap-3 rounded-md border bg-background p-3">
              <div className="grid gap-3 md:grid-cols-2">
                <DetailFact label="Client" value={operation.customerName ?? operation.customerUserId} />
                <DetailFact label="Client user" value={operation.customerUserId} mono />
                <DetailFact label="Agence" value={operation.agencyCode} />
                <DetailFact label="Agence ID" value={operation.agencyId} mono />
                <DetailFact label="Agent" value={operation.agentUserId} mono />
                <DetailFact label="Contrat agent" value={operation.agentContractId} mono />
                <DetailFact label="Tenant" value={operation.tenantId} mono />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Montants et commissions</h3>
              <Badge variant="outline" className="text-muted-foreground">
                {operation.currency}
              </Badge>
            </div>
            <div className="grid gap-3 rounded-md border bg-background p-3 md:grid-cols-2">
              <DetailFact
                label="Montant operation"
                value={formatMinorAmount(operation.amountMinor, operation.currency)}
              />
              <DetailFact
                label="Montant brut"
                value={formatOptionalMinorAmount(operation.grossAmountMinor, operation.currency)}
              />
              <DetailFact
                label="Net client"
                value={formatOptionalMinorAmount(operation.customerNetAmountMinor, operation.currency)}
              />
              <DetailFact
                label="Commission totale"
                value={formatOptionalMinorAmount(operation.commissionAmountMinor, operation.currency)}
              />
              <DetailFact
                label="Commission agent"
                value={formatOptionalMinorAmount(operation.agentCommissionAmountMinor, operation.currency)}
              />
              <DetailFact
                label="Commission platform"
                value={formatOptionalMinorAmount(operation.platformCommissionAmountMinor, operation.currency)}
              />
            </div>
          </div>

          {operation.failureReason ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
              {operation.failureReason}
            </div>
          ) : null}

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Metadata cash / ledger</h3>
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
                Aucune metadata disponible pour cette operation.
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <h3 className="font-medium text-sm">Payload operation</h3>
            <pre className="max-h-72 overflow-auto rounded-md border bg-muted/20 p-3 text-xs">
              {JSON.stringify(operation, null, 2)}
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailFact({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn("break-all text-sm", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}

function CashOperationDirectionBadge({
  operationType,
  status,
}: {
  operationType: CashOperationResponse["operationType"];
  status: CashOperationResponse["status"];
}) {
  const isCredit = operationType === "cash_in";
  const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        isCredit && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        !isCredit && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      )}
    >
      <Icon className="size-3" />
      {formatCashOperationType(operationType)}
      <span className="text-muted-foreground">/</span>
      {formatCashStatus(status)}
    </Badge>
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
      operationType: "Type",
      postedAt: "Posting",
      status: "Statut",
    }[key] ?? "Creation";

  return `${label}, ${direction === "asc" ? "asc" : "desc"}`;
}

function formatSignedAmount(operation: CashOperationResponse) {
  const sign = operation.operationType === "cash_out" ? "-" : "+";

  return `${sign}${formatMinorAmount(operation.amountMinor, operation.currency)}`;
}

function formatOptionalMinorAmount(value: number | null | undefined, currency: string) {
  return value == null ? "-" : formatMinorAmount(value, currency);
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

function shortId(value: string) {
  return value.length > 13 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
