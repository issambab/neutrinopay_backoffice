"use client";
"use no memo";

import type * as React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  GitFork,
  RotateCcw,
  ShieldCheck,
  Store,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatKycEnum, kycStatusClassName } from "@/lib/kyc/kyc-format";
import type { BusinessResponse, PageResponse } from "@/lib/organization/organization.types";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [10, 20, 30, 40, 50];
const STATUSES = ["pending", "active", "suspended", "blocked", "closed", "archived"];
const BUSINESS_TYPES = ["merchant", "fuel_station", "retail", "restaurant", "service", "partner"];

type MerchantsTableFilters = {
  businessType: string;
  status: string;
};

type MerchantsTableProps = {
  businesses: PageResponse<BusinessResponse>;
  filters: MerchantsTableFilters;
  pageSize: number;
  sort: string;
};

export function MerchantsTable({ businesses, filters, pageSize, sort }: MerchantsTableProps) {
  const router = useRouter();

  function pushFilters(nextFilters: Partial<MerchantsTableFilters>, nextPage = 0, nextSize = pageSize) {
    const searchParams = new URLSearchParams();
    const merged = { ...filters, ...nextFilters };
    searchParams.set("page", String(nextPage));
    searchParams.set("size", String(nextSize));
    searchParams.set("sort", sort);
    appendIfPresent(searchParams, "status", merged.status);
    appendIfPresent(searchParams, "businessType", merged.businessType);

    router.push(`/dashboard/merchants?${searchParams.toString()}`);
  }

  function pushSort(sortKey: string) {
    const [currentKey, currentDirection] = parseSort(sort);
    const nextDirection = currentKey === sortKey && currentDirection === "asc" ? "desc" : "asc";
    const searchParams = new URLSearchParams();
    searchParams.set("page", "0");
    searchParams.set("size", String(pageSize));
    searchParams.set("sort", `${sortKey},${nextDirection}`);
    appendIfPresent(searchParams, "status", filters.status);
    appendIfPresent(searchParams, "businessType", filters.businessType);

    router.push(`/dashboard/merchants?${searchParams.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Statut
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={filters.status || "all"}
                onValueChange={(value) => pushFilters({ status: value === "all" ? "" : value })}
              >
                <DropdownMenuRadioItem value="all">Tous statuts</DropdownMenuRadioItem>
                {STATUSES.map((status) => (
                  <DropdownMenuRadioItem key={status} value={status}>
                    {formatEnum(status)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Type
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={filters.businessType || "all"}
                onValueChange={(value) => pushFilters({ businessType: value === "all" ? "" : value })}
              >
                <DropdownMenuRadioItem value="all">Tous types</DropdownMenuRadioItem>
                {BUSINESS_TYPES.map((type) => (
                  <DropdownMenuRadioItem key={type} value={type}>
                    {formatEnum(type)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/merchants">
              <RotateCcw />
              Reset
            </Link>
          </Button>
          <Button variant="outline" size="sm" disabled>
            <ArrowUpDown />
            {formatSortLabel(sort)}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader className="bg-muted/15">
            <TableRow>
              <TableHead className="h-11 p-3">
                <SortableHeader label="Marchand" sortKey="name" currentSort={sort} onSort={pushSort} />
              </TableHead>
              <TableHead className="h-11 p-3">
                <SortableHeader label="Type" sortKey="businessType" currentSort={sort} onSort={pushSort} />
              </TableHead>
              <TableHead className="h-11 p-3">
                <SortableHeader label="Statut" sortKey="status" currentSort={sort} onSort={pushSort} />
              </TableHead>
              <TableHead className="h-11 p-3">
                <SortableHeader label="KYC" sortKey="kycStatus" currentSort={sort} onSort={pushSort} />
              </TableHead>
              <TableHead className="h-11 p-3">Contact</TableHead>
              <TableHead className="h-11 p-3">Zone</TableHead>
              <TableHead className="h-11 p-3">
                <SortableHeader label="Cree le" sortKey="createdAt" currentSort={sort} onSort={pushSort} />
              </TableHead>
              <TableHead className="h-11 p-3" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {businesses.content.length ? (
              businesses.content.map((business) => (
                <TableRow key={business.id}>
                  <TableCell className="p-3">
                    <Link href={`/dashboard/merchants/${business.id}`} className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-md border bg-muted">
                        <Store className="size-4 text-muted-foreground" />
                      </span>
                      <span className="grid min-w-0 gap-0.5">
                        <span className="truncate font-medium text-sm leading-none">{business.name}</span>
                        <span className="truncate text-muted-foreground text-xs leading-none">
                          {business.registrationNumber ?? business.externalReference ?? business.id}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="p-3">
                    <Badge variant="outline" className="px-1.5 text-muted-foreground">
                      {formatEnum(business.businessType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-3">
                    <Badge variant="outline" className={statusClassName(business.status)}>
                      {formatEnum(business.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-3">
                    <Badge variant="outline" className={kycStatusClassName(business.kycStatus ?? "not_started")}>
                      {formatKycEnum(business.kycStatus ?? "not_started")}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-3 text-sm">
                    <div className="grid gap-0.5">
                      <span>{business.contactEmail ?? "Aucun email"}</span>
                      <span className="text-muted-foreground text-xs">
                        {business.contactPhone ?? "Aucun telephone"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="p-3 text-sm">{business.zone ?? business.city ?? "-"}</TableCell>
                  <TableCell className="p-3 text-sm">{formatDate(business.createdAt)}</TableCell>
                  <TableCell className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" className="size-8">
                        <Link
                          href={`/dashboard/merchants/${business.id}/tree`}
                          aria-label={`Voir l'arborescence de ${business.name}`}
                        >
                          <GitFork className="size-4" />
                          <span className="sr-only">Arborescence</span>
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon" className="size-8">
                        <Link
                          href={`/dashboard/merchants/${business.id}?tab=kyc`}
                          aria-label={`Voir l'etat KYC de ${business.name}`}
                        >
                          <ShieldCheck className="size-4" />
                          <span className="sr-only">KYC</span>
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/merchants/${business.id}`}>
                          <Eye />
                          Voir
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Aucun marchand trouve.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
          {businesses.content.length} ligne(s) affichee(s) sur {businesses.totalElements}.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="merchants-rows-per-page" className="font-medium text-sm">
              Rows per page
            </Label>
            <Select value={`${pageSize}`} onValueChange={(value) => pushFilters({}, 0, Number(value))}>
              <SelectTrigger size="sm" className="w-20" id="merchants-rows-per-page">
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
            Page {businesses.page + 1} of {Math.max(businesses.totalPages, 1)}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <PaginationIconButton disabled={businesses.first} onClick={() => pushFilters({}, 0)}>
              <span className="sr-only">Aller a la premiere page</span>
              <ChevronsLeft className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton
              disabled={businesses.first}
              onClick={() => pushFilters({}, Math.max(businesses.page - 1, 0))}
            >
              <span className="sr-only">Aller a la page precedente</span>
              <ChevronLeft className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton disabled={businesses.last} onClick={() => pushFilters({}, businesses.page + 1)}>
              <span className="sr-only">Aller a la page suivante</span>
              <ChevronRight className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton
              disabled={businesses.last}
              onClick={() => pushFilters({}, Math.max(businesses.totalPages - 1, 0))}
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
  const isActive = currentKey === sortKey;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 h-7 px-2 font-medium"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <ArrowUpDown className={cn("size-3.5", isActive ? "text-foreground" : "text-muted-foreground")} />
      {isActive && <span className="sr-only">tri {currentDirection === "asc" ? "ascendant" : "descendant"}</span>}
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
      name: "Marchand",
      businessType: "Type",
      status: "Statut",
      kycStatus: "KYC",
      createdAt: "Cree le",
    }[key] ?? "Cree le";

  return `${label}, ${direction === "asc" ? "asc" : "desc"}`;
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClassName(status: string) {
  return cn(
    "px-1.5",
    status === "active" && "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
    status !== "active" && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  );
}
