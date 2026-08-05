"use client";
"use no memo";

import * as React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
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
import type { PageResponse, UserResponse } from "@/lib/iam/iam.types";
import { cn } from "@/lib/utils";

const USER_TYPES = [
  "platform_admin",
  "ops",
  "merchant",
  "employee",
  "cash_agent",
  "client",
  "fleet_user",
  "partner",
  "system",
];
const USER_STATUSES = ["draft", "pending", "active", "suspended", "blocked", "closed", "archived"];
const KYC_STATUSES = ["not_started", "pending", "in_review", "verified", "rejected", "expired"];
const PAGE_SIZES = [10, 20, 30, 40, 50];

type UsersTableFilters = {
  kyc: string;
  q: string;
  status: string;
  type: string;
};

type UsersTableProps = {
  filters: UsersTableFilters;
  pageSize: number;
  sort: string;
  users: PageResponse<UserResponse>;
};

export function UsersTable({ filters, pageSize, sort, users }: UsersTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = React.useState(filters.q);

  const table = useReactTable({
    data: users.content,
    columns: getUsersColumns(sort, pushSort),
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.max(users.totalPages, 1),
  });

  React.useEffect(() => {
    setSearchValue(filters.q);
  }, [filters.q]);

  function pushFilters(nextFilters: Partial<UsersTableFilters>, nextPage = 0, nextSize = pageSize) {
    const searchParams = new URLSearchParams();
    const merged = { ...filters, ...nextFilters };
    searchParams.set("page", String(nextPage));
    searchParams.set("size", String(nextSize));
    appendIfPresent(searchParams, "q", merged.q);
    appendIfPresent(searchParams, "status", merged.status);
    appendIfPresent(searchParams, "type", merged.type);
    appendIfPresent(searchParams, "kyc", merged.kyc);
    appendIfPresent(searchParams, "sort", sort);

    router.push(`/dashboard/users?${searchParams.toString()}`);
  }

  function pushSort(sortKey: string) {
    const [currentKey, currentDirection] = parseSort(sort);
    const nextDirection = currentKey === sortKey && currentDirection === "asc" ? "desc" : "asc";
    const searchParams = new URLSearchParams();
    searchParams.set("page", "0");
    searchParams.set("size", String(pageSize));
    searchParams.set("sort", `${sortKey},${nextDirection}`);
    appendIfPresent(searchParams, "q", filters.q);
    appendIfPresent(searchParams, "status", filters.status);
    appendIfPresent(searchParams, "type", filters.type);
    appendIfPresent(searchParams, "kyc", filters.kyc);

    router.push(`/dashboard/users?${searchParams.toString()}`);
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
              placeholder="Email ou nom..."
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
                <CheckCircle2 />
                Statut
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={filters.status || "all"}
                onValueChange={(value) => pushFilters({ status: value === "all" ? "" : value })}
              >
                <DropdownMenuRadioItem value="all">Tous statuts</DropdownMenuRadioItem>
                {USER_STATUSES.map((status) => (
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
                <UsersRound />
                Type
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={filters.type || "all"}
                onValueChange={(value) => pushFilters({ type: value === "all" ? "" : value })}
              >
                <DropdownMenuRadioItem value="all">Tous types</DropdownMenuRadioItem>
                {USER_TYPES.map((type) => (
                  <DropdownMenuRadioItem key={type} value={type}>
                    {formatEnum(type)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ShieldCheck />
                KYC
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={filters.kyc || "all"}
                onValueChange={(value) => pushFilters({ kyc: value === "all" ? "" : value })}
              >
                <DropdownMenuRadioItem value="all">Tous KYC</DropdownMenuRadioItem>
                {KYC_STATUSES.map((kyc) => (
                  <DropdownMenuRadioItem key={kyc} value={kyc}>
                    {formatEnum(kyc)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center xl:w-auto">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/users">
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
                  Aucun utilisateur trouve.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
          {users.content.length} ligne(s) affichee(s) sur {users.totalElements}.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="users-rows-per-page" className="font-medium text-sm">
              Rows per page
            </Label>
            <Select value={`${pageSize}`} onValueChange={(value) => pushFilters({}, 0, Number(value))}>
              <SelectTrigger size="sm" className="w-20" id="users-rows-per-page">
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
            Page {users.page + 1} of {Math.max(users.totalPages, 1)}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <PaginationIconButton disabled={users.first} onClick={() => pushFilters({}, 0)}>
              <span className="sr-only">Aller a la premiere page</span>
              <ChevronsLeft className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton disabled={users.first} onClick={() => pushFilters({}, Math.max(users.page - 1, 0))}>
              <span className="sr-only">Aller a la page precedente</span>
              <ChevronLeft className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton disabled={users.last} onClick={() => pushFilters({}, users.page + 1)}>
              <span className="sr-only">Aller a la page suivante</span>
              <ChevronRight className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton
              disabled={users.last}
              onClick={() => pushFilters({}, Math.max(users.totalPages - 1, 0))}
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

function getUsersColumns(sort: string, onSort: (sortKey: string) => void): ColumnDef<UserResponse>[] {
  return [
    {
      accessorKey: "fullName",
      header: () => <SortableHeader label="Utilisateur" sortKey="fullName" currentSort={sort} onSort={onSort} />,
      cell: ({ row }) => (
        <Link href={`/dashboard/users/${row.original.id}`} className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border bg-muted">
            <UserRound className="size-4 text-muted-foreground" />
          </span>
          <span className="grid min-w-0 gap-0.5">
            <span className="truncate font-medium text-sm leading-none">
              {row.original.fullName ?? row.original.email ?? row.original.phoneNumber ?? row.original.id}
            </span>
            <span className="truncate text-muted-foreground text-xs leading-none">
              {row.original.email ?? row.original.phoneNumber ?? row.original.id}
            </span>
          </span>
        </Link>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "userType",
      header: () => <SortableHeader label="Type" sortKey="userType" currentSort={sort} onSort={onSort} />,
      cell: ({ row }) => (
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {formatEnum(row.original.userType)}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: () => <SortableHeader label="Statut" sortKey="status" currentSort={sort} onSort={onSort} />,
      cell: ({ row }) => (
        <Badge variant="outline" className={statusClassName(row.original.status)}>
          {formatEnum(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "kycStatus",
      header: () => <SortableHeader label="KYC" sortKey="kycStatus" currentSort={sort} onSort={onSort} />,
      cell: ({ row }) => (
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {formatEnum(row.original.kycStatus)}
        </Badge>
      ),
    },
    {
      accessorKey: "mfaEnabled",
      header: () => <SortableHeader label="MFA" sortKey="mfaEnabled" currentSort={sort} onSort={onSort} />,
      cell: ({ row }) => <span className="text-sm">{row.original.mfaEnabled ? "Oui" : "Non"}</span>,
    },
    {
      accessorKey: "createdAt",
      header: () => <SortableHeader label="Cree le" sortKey="createdAt" currentSort={sort} onSort={onSort} />,
      cell: ({ row }) => (
        <div className="grid gap-0.5">
          <span className="text-sm">{formatDate(row.original.createdAt)}</span>
          <span className="text-muted-foreground text-xs">
            {row.original.lastLoginAt ? "Connexion recente" : "Jamais connecte"}
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
            <Link href={`/dashboard/users/${row.original.id}`}>
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
  return value.toLowerCase().replaceAll("_", " ");
}

function parseSort(sort: string) {
  const [key = "createdAt", direction = "desc"] = sort.split(",");
  return [key, direction] as const;
}

function formatSortLabel(sort: string) {
  const [key, direction] = parseSort(sort);
  const label =
    {
      fullName: "Utilisateur",
      userType: "Type",
      status: "Statut",
      kycStatus: "KYC",
      mfaEnabled: "MFA",
      createdAt: "Cree le",
    }[key] ?? "Cree le";

  return `${label}, ${direction === "asc" ? "asc" : "desc"}`;
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
