"use client";
"use no memo";

import * as React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  KeyRound,
  RotateCcw,
  Search,
  ShieldCheck,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PageResponse, RoleResponse } from "@/lib/iam/iam.types";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [10, 20, 30, 40, 50];

type RolesTableFilters = {
  q: string;
  system: string;
};

type RolesTableProps = {
  filters: RolesTableFilters;
  pageSize: number;
  sort: string;
  roles: PageResponse<RoleResponse>;
};

export function RolesTable({ filters, pageSize, roles, sort }: RolesTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = React.useState(filters.q);

  const table = useReactTable({
    data: roles.content,
    columns: getRolesColumns(sort, pushSort),
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.max(roles.totalPages, 1),
  });

  React.useEffect(() => {
    setSearchValue(filters.q);
  }, [filters.q]);

  function pushFilters(nextFilters: Partial<RolesTableFilters>, nextPage = 0, nextSize = pageSize) {
    const searchParams = new URLSearchParams();
    const merged = { ...filters, ...nextFilters };
    searchParams.set("page", String(nextPage));
    searchParams.set("size", String(nextSize));
    appendIfPresent(searchParams, "q", merged.q);
    appendIfPresent(searchParams, "system", merged.system);
    appendIfPresent(searchParams, "sort", sort);

    router.push(`/dashboard/roles?${searchParams.toString()}`);
  }

  function pushSort(sortKey: string) {
    const [currentKey, currentDirection] = parseSort(sort);
    const nextDirection = currentKey === sortKey && currentDirection === "asc" ? "desc" : "asc";
    const searchParams = new URLSearchParams();
    searchParams.set("page", "0");
    searchParams.set("size", String(pageSize));
    searchParams.set("sort", `${sortKey},${nextDirection}`);
    appendIfPresent(searchParams, "q", filters.q);
    appendIfPresent(searchParams, "system", filters.system);

    router.push(`/dashboard/roles?${searchParams.toString()}`);
  }

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushFilters({ q: searchValue });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={onSearchSubmit} className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-7 rounded-[min(var(--radius-md),12px)] pr-16 pl-8"
              placeholder="Code ou nom du role..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="absolute top-1/2 right-1 h-6 -translate-y-1/2 px-2"
            >
              OK
            </Button>
          </form>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ShieldCheck />
                Type
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={filters.system || "all"}
                onValueChange={(value) => pushFilters({ system: value === "all" ? "" : value })}
              >
                <DropdownMenuRadioItem value="all">Tous roles</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="custom">Modifiables</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">Systeme</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center xl:w-auto">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/roles">
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
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan} className="h-11 p-3 font-medium">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Aucun role trouve sur cette page.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
          {roles.content.length} ligne(s) affichee(s) sur {roles.totalElements}.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="roles-rows-per-page" className="font-medium text-sm">
              Rows per page
            </Label>
            <Select value={`${pageSize}`} onValueChange={(value) => pushFilters({}, 0, Number(value))}>
              <SelectTrigger size="sm" className="w-20" id="roles-rows-per-page">
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
            Page {roles.page + 1} of {Math.max(roles.totalPages, 1)}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <PaginationIconButton disabled={roles.first} onClick={() => pushFilters({}, 0)}>
              <span className="sr-only">Aller a la premiere page</span>
              <ChevronsLeft className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton disabled={roles.first} onClick={() => pushFilters({}, Math.max(roles.page - 1, 0))}>
              <span className="sr-only">Aller a la page precedente</span>
              <ChevronLeft className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton disabled={roles.last} onClick={() => pushFilters({}, roles.page + 1)}>
              <span className="sr-only">Aller a la page suivante</span>
              <ChevronRight className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton
              disabled={roles.last}
              onClick={() => pushFilters({}, Math.max(roles.totalPages - 1, 0))}
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

function getRolesColumns(sort: string, onSort: (sortKey: string) => void): ColumnDef<RoleResponse>[] {
  return [
    {
      accessorKey: "name",
      header: () => <SortableHeader label="Role" sortKey="name" currentSort={sort} onSort={onSort} />,
      cell: ({ row }) => (
        <Link href={`/dashboard/roles/${row.original.id}`} className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border bg-muted">
            <KeyRound className="size-4 text-muted-foreground" />
          </span>
          <span className="grid min-w-0 gap-0.5">
            <span className="truncate font-medium text-sm leading-none">{row.original.name}</span>
            <span className="break-all font-mono text-muted-foreground text-xs leading-none">{row.original.code}</span>
          </span>
        </Link>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "scope",
      header: () => <SortableHeader label="Scope" sortKey="scope" currentSort={sort} onSort={onSort} />,
      cell: ({ row }) => (
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {formatEnum(row.original.scope)}
        </Badge>
      ),
    },
    {
      accessorKey: "system",
      header: () => <SortableHeader label="Type" sortKey="system" currentSort={sort} onSort={onSort} />,
      cell: ({ row }) => (
        <Badge variant="outline" className={roleTypeClassName(row.original.system)}>
          {row.original.system ? "systeme" : "modifiable"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => <SortableHeader label="Cree le" sortKey="createdAt" currentSort={sort} onSort={onSort} />,
      cell: ({ row }) => (
        <div className="grid gap-0.5">
          <span className="text-sm">{formatDate(row.original.createdAt)}</span>
          <span className="text-muted-foreground text-xs">
            {row.original.updatedAt ? `Maj ${formatDate(row.original.updatedAt)}` : "Jamais modifie"}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/roles/${row.original.id}`}>
              <Eye />
              Voir
            </Link>
          </Button>
        </div>
      ),
    },
  ];
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

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function parseSort(sort: string) {
  const [key = "createdAt", direction = "desc"] = sort.split(",");
  return [key, direction] as const;
}

function formatSortLabel(sort: string) {
  const [key, direction] = parseSort(sort);
  const label =
    {
      name: "Role",
      scope: "Scope",
      system: "Type",
      createdAt: "Cree le",
    }[key] ?? "Cree le";

  return `${label}, ${direction === "asc" ? "asc" : "desc"}`;
}

function roleTypeClassName(system: boolean) {
  return cn(
    "px-1.5",
    system && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    !system && "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
  );
}
