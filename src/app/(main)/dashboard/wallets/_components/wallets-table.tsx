"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowUpDown,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { OwnerType, PageResponse, WalletResponse } from "@/lib/wallet/wallet.types";
import { formatAssetMinorMoney, formatWalletEnum, walletStatusClassName } from "@/lib/wallet/wallet-format";

type WalletsFilters = {
  ownerId: string;
  status: string;
};

type WalletsTableProps = {
  basePath: string;
  fixedOwnerType?: OwnerType;
  filters: WalletsFilters;
  pageSize: number;
  sort: string;
  wallets: PageResponse<WalletResponse>;
};

const PAGE_SIZES = [10, 20, 30, 40, 50];
const WALLET_STATUSES = ["draft", "pending", "active", "suspended", "blocked", "closed", "archived"];

export function WalletsTable({ basePath, fixedOwnerType, filters, pageSize, sort, wallets }: WalletsTableProps) {
  const router = useRouter();
  const [ownerId, setOwnerId] = useState(filters.ownerId);

  useEffect(() => {
    setOwnerId(filters.ownerId);
  }, [filters.ownerId]);

  function pushFilters(nextFilters: Partial<WalletsFilters>, nextPage = 0, nextSize = pageSize) {
    const searchParams = new URLSearchParams();
    const merged = { ...filters, ...nextFilters };
    searchParams.set("page", String(nextPage));
    searchParams.set("size", String(nextSize));
    appendIfPresent(searchParams, "sort", sort);
    appendIfPresent(searchParams, "ownerId", merged.ownerId);
    appendIfPresent(searchParams, "status", merged.status);

    router.push(`${basePath}?${searchParams.toString()}`);
  }

  function pushSort(sortKey: string) {
    const [currentKey, currentDirection] = parseSort(sort);
    const nextDirection = currentKey === sortKey && currentDirection === "asc" ? "desc" : "asc";
    const searchParams = new URLSearchParams();
    searchParams.set("page", "0");
    searchParams.set("size", String(pageSize));
    searchParams.set("sort", `${sortKey},${nextDirection}`);
    appendIfPresent(searchParams, "ownerId", filters.ownerId);
    appendIfPresent(searchParams, "status", filters.status);

    router.push(`${basePath}?${searchParams.toString()}`);
  }

  function onOwnerSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushFilters({ ownerId });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={onOwnerSubmit} className="relative w-full lg:w-96">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 pr-16 pl-8"
              onChange={(event) => setOwnerId(event.target.value)}
              placeholder="Owner ID..."
              value={ownerId}
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
            {WALLET_STATUSES.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {formatWalletEnum(status)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {fixedOwnerType ? (
            <Badge variant="outline" className="h-8 rounded-md px-3">
              {formatOwnerType(fixedOwnerType)}
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild variant="outline" size="sm">
            <Link href={basePath}>
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
              <TableHead className="w-[220px]">
                <SortableHeader currentSort={sort} label="Wallet" onSort={pushSort} sortKey="createdAt" />
              </TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>
                <SortableHeader currentSort={sort} label="Statut" onSort={pushSort} sortKey="status" />
              </TableHead>
              <TableHead className="text-right">Balance Ledger</TableHead>
              <TableHead>Compte principal</TableHead>
              <TableHead className="text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wallets.content.length ? (
              wallets.content.map((wallet) => <WalletRow key={wallet.id} wallet={wallet} />)
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Aucun wallet ne correspond aux filtres.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
          {wallets.content.length} ligne(s) affichee(s) sur {wallets.totalElements}.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="wallets-rows-per-page" className="font-medium text-sm">
              Rows per page
            </Label>
            <Select value={`${pageSize}`} onValueChange={(value) => pushFilters({}, 0, Number(value))}>
              <SelectTrigger size="sm" className="w-20" id="wallets-rows-per-page">
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
            Page {wallets.page + 1} of {Math.max(wallets.totalPages, 1)}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <PaginationIconButton disabled={wallets.first} onClick={() => pushFilters({}, 0)}>
              <span className="sr-only">Aller a la premiere page</span>
              <ChevronsLeft className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton disabled={wallets.first} onClick={() => pushFilters({}, wallets.page - 1)}>
              <span className="sr-only">Page precedente</span>
              <ChevronLeft className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton disabled={wallets.last} onClick={() => pushFilters({}, wallets.page + 1)}>
              <span className="sr-only">Page suivante</span>
              <ChevronRight className="size-4" />
            </PaginationIconButton>
            <PaginationIconButton
              disabled={wallets.last}
              onClick={() => pushFilters({}, Math.max(wallets.totalPages - 1, 0))}
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

function WalletRow({ wallet }: { wallet: WalletResponse }) {
  const primaryAccount = wallet.accounts[0];
  const asset = primaryAccount?.asset ?? "TND/2";
  const walletHref = `/dashboard/wallets/${wallet.id}`;

  return (
    <TableRow>
      <TableCell>
        <div className="grid gap-1">
          <span className="truncate font-medium">{wallet.label ?? formatWalletEnum(wallet.walletType)}</span>
          <span className="font-mono text-muted-foreground text-xs">{shortId(wallet.id)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="grid gap-1">
          <span className="truncate text-sm">{wallet.ownerDisplayName ?? formatOwnerType(wallet.ownerType)}</span>
          {wallet.ownerEmail ? (
            <span className="truncate text-muted-foreground text-xs">{wallet.ownerEmail}</span>
          ) : null}
          <span className="break-all font-mono text-muted-foreground text-xs">{wallet.ownerId}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{formatWalletEnum(wallet.walletType)}</Badge>
      </TableCell>
      <TableCell>
        <Badge className={walletStatusClassName(wallet.status)} variant="outline">
          {formatWalletEnum(wallet.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="grid gap-1">
          <span className="font-medium">{formatLedgerBalance(wallet)}</span>
          <span className="text-muted-foreground text-xs">{formatLedgerBalanceStatus(wallet.ledgerBalanceStatus)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="grid max-w-72 gap-1">
          <span className="truncate font-mono text-xs">
            {wallet.ledgerAccountAddress ?? primaryAccount?.ledgerAccountAddress ?? "-"}
          </span>
          <span className="text-muted-foreground text-xs">{wallet.ledgerAsset ?? primaryAccount?.asset ?? asset}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href={walletHref}>
            <Eye className="size-4" />
            <span className="sr-only">Ouvrir le wallet</span>
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

function formatOwnerType(ownerType: string) {
  const labels: Record<string, string> = {
    business: "Marchand",
    cash_agent: "Agent",
    user: "Client",
  };

  return labels[ownerType] ?? formatWalletEnum(ownerType);
}

function formatLedgerBalance(wallet: WalletResponse) {
  if (wallet.ledgerAvailableBalanceMinor == null || wallet.ledgerBalanceStatus !== "available") {
    return "Indisponible";
  }
  return formatAssetMinorMoney(
    wallet.ledgerAvailableBalanceMinor,
    wallet.defaultCurrency,
    wallet.ledgerAsset ?? "TND/2",
  );
}

function formatLedgerBalanceStatus(status?: string | null) {
  return status === "available" ? "Ledger reel" : "Lecture Ledger indisponible";
}

function formatSortLabel(sort: string) {
  const [key, direction] = parseSort(sort);
  return `${formatWalletEnum(key)} ${direction}`;
}

function parseSort(sort: string) {
  const [key = "createdAt", direction = "desc"] = sort.split(",");
  return [key, direction] as const;
}

function shortId(value: string) {
  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}
