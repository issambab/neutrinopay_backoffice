"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AgencyResponse, CashAgentContractResponse, LifecycleStatus, PageResponse } from "@/lib/cash/cash.types";
import { cashStatusClassName, formatCashStatus } from "@/lib/cash/cash-format";
import { cn } from "@/lib/utils";

type AgenciesAdminPanelProps = {
  agencies: PageResponse<AgencyResponse>;
  contractsByAgencyId: Record<string, CashAgentContractResponse[]>;
  filters: {
    q: string;
    status: string;
  };
  pageSize: number;
  sort: string;
};

const PAGE_SIZES = [10, 20, 30, 40, 50];
const STATUS_OPTIONS: LifecycleStatus[] = ["pending", "active", "suspended", "closed"];

export function AgenciesAdminPanel({
  agencies,
  contractsByAgencyId,
  filters,
  pageSize,
  sort,
}: AgenciesAdminPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(filters.q);

  useEffect(() => {
    setSearchValue(filters.q);
  }, [filters.q]);

  function pushFilters(nextFilters: Partial<typeof filters>, nextPage = 0, nextSize = pageSize) {
    const params = new URLSearchParams(searchParams.toString());
    const merged = { ...filters, ...nextFilters };
    params.set("page", String(nextPage));
    params.set("size", String(nextSize));
    appendIfPresent(params, "sort", sort);
    setOrDelete(params, "q", merged.q);
    setOrDelete(params, "status", merged.status);
    router.push(`${pathname}?${params.toString()}`);
  }

  function pushSort(sortKey: string) {
    const [currentKey, currentDirection] = parseSort(sort);
    const nextDirection = currentKey === sortKey && currentDirection === "asc" ? "desc" : "asc";
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "0");
    params.set("size", String(pageSize));
    params.set("sort", `${sortKey},${nextDirection}`);
    setOrDelete(params, "q", filters.q);
    setOrDelete(params, "status", filters.status);
    router.push(`${pathname}?${params.toString()}`);
  }

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushFilters({ q: searchValue });
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
            <CardTitle>Liste des agences</CardTitle>
            <p className="mt-1 text-muted-foreground text-sm">
              Listing seulement. Ouvrez une agence pour modifier ses informations et gerer ses agents.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/agencies/new">
              <Plus />
              Nouvelle agence
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={onSearchSubmit} className="relative w-full lg:w-96">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pr-16 pl-8"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Code, nom, ville ou zone"
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
              {STATUS_OPTIONS.map((status) => (
                <NativeSelectOption key={status} value={status}>
                  {formatCashStatus(status)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button onClick={resetFilters} type="button" variant="outline" size="sm">
              <RotateCcw />
              Reset
            </Button>
            <Button disabled size="sm" variant="outline">
              <ArrowUpDown />
              {formatSortLabel(sort)}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-md border bg-card">
          <Table>
            <TableHeader className="bg-muted/15">
              <TableRow>
                <TableHead className="w-[220px]">
                  <SortableHeader currentSort={sort} label="Agence" onSort={pushSort} sortKey="name" />
                </TableHead>
                <TableHead>
                  <SortableHeader currentSort={sort} label="Code" onSort={pushSort} sortKey="agencyCode" />
                </TableHead>
                <TableHead>
                  <SortableHeader currentSort={sort} label="Statut" onSort={pushSort} sortKey="status" />
                </TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Agents</TableHead>
                <TableHead className="text-right">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agencies.content.length ? (
                agencies.content.map((agency) => (
                  <AgencyRow agency={agency} contracts={contractsByAgencyId[agency.id] ?? []} key={agency.id} />
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

        <div className="flex items-center justify-between px-1">
          <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
            {agencies.content.length} ligne(s) affichee(s) sur {agencies.totalElements}.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="agencies-rows-per-page" className="font-medium text-sm">
                Rows per page
              </Label>
              <Select value={`${pageSize}`} onValueChange={(value) => pushFilters({}, 0, Number(value))}>
                <SelectTrigger size="sm" className="w-20" id="agencies-rows-per-page">
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
              Page {agencies.page + 1} of {Math.max(agencies.totalPages, 1)}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <PaginationIconButton disabled={agencies.first} onClick={() => pushFilters({}, 0)}>
                <span className="sr-only">Aller a la premiere page</span>
                <ChevronsLeft className="size-4" />
              </PaginationIconButton>
              <PaginationIconButton
                disabled={agencies.first}
                onClick={() => pushFilters({}, Math.max(agencies.page - 1, 0))}
              >
                <span className="sr-only">Page precedente</span>
                <ChevronLeft className="size-4" />
              </PaginationIconButton>
              <PaginationIconButton disabled={agencies.last} onClick={() => pushFilters({}, agencies.page + 1)}>
                <span className="sr-only">Page suivante</span>
                <ChevronRight className="size-4" />
              </PaginationIconButton>
              <PaginationIconButton
                disabled={agencies.last}
                onClick={() => pushFilters({}, Math.max(agencies.totalPages - 1, 0))}
              >
                <span className="sr-only">Aller a la derniere page</span>
                <ChevronsRight className="size-4" />
              </PaginationIconButton>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AgencyRow({ agency, contracts }: { agency: AgencyResponse; contracts: CashAgentContractResponse[] }) {
  const activeContracts = contracts.filter((contract) => contract.status === "active");

  return (
    <TableRow>
      <TableCell>
        <div className="grid gap-1">
          <Link className="truncate font-medium hover:underline" href={`/dashboard/agencies/${agency.id}`}>
            {agency.name}
          </Link>
          <span className="font-mono text-muted-foreground text-xs">{shortId(agency.id)}</span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-muted-foreground text-xs">{agency.agencyCode}</TableCell>
      <TableCell>
        <Badge className={cashStatusClassName(agency.status)} variant="outline">
          {formatCashStatus(agency.status)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="grid gap-1">
          <span className="truncate text-sm">{agency.city ?? agency.region ?? "-"}</span>
          <span className="text-muted-foreground text-xs">{agency.zone ?? agency.countryCode ?? "-"}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="grid max-w-72 gap-1">
          <span className="truncate text-sm">{agency.contactEmail ?? "-"}</span>
          <span className="truncate text-muted-foreground text-xs">{agency.contactPhone ?? "-"}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="grid gap-1">
          <span className="font-medium">
            {activeContracts.length}/{contracts.length}
          </span>
          <span className="text-muted-foreground text-xs">actifs</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href={`/dashboard/agencies/${agency.id}`}>
            <Eye className="size-4" />
            <span className="sr-only">Ouvrir l'agence</span>
          </Link>
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
  const [currentKey, currentDirection] = parseSort(currentSort);
  const active = currentKey === sortKey;

  return (
    <Button className="-ml-2 h-7 px-2" size="sm" variant="ghost" onClick={() => onSort(sortKey)}>
      {label}
      <ArrowUpDown className={cn("size-3.5", active && "text-primary")} />
      {active ? <span className="sr-only">{currentDirection}</span> : null}
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
    <Button disabled={disabled} onClick={onClick} size="icon-sm" variant="outline">
      {children}
    </Button>
  );
}

function appendIfPresent(searchParams: URLSearchParams, key: string, value?: string) {
  if (value?.trim()) {
    searchParams.set(key, value.trim());
  }
}

function setOrDelete(searchParams: URLSearchParams, key: string, value?: string) {
  if (value?.trim()) {
    searchParams.set(key, value.trim());
  } else {
    searchParams.delete(key);
  }
}

function formatSortLabel(sort: string) {
  const [key, direction] = parseSort(sort);
  const labels: Record<string, string> = {
    agencyCode: "Code",
    createdAt: "Creation",
    name: "Agence",
    status: "Statut",
  };
  return `${labels[key] ?? key} ${direction}`;
}

function parseSort(sort: string) {
  const [key = "createdAt", direction = "desc"] = sort.split(",");
  return [key, direction] as const;
}

function shortId(value: string) {
  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}
