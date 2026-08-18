import type { ComponentType } from "react";

import Link from "next/link";

import { Landmark, ShieldCheck, UsersRound, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/lib/iam/users.server";
import { cn } from "@/lib/utils";
import { getAdminWalletBalance, listAdminWallets } from "@/lib/wallet/wallet.server";
import type { OwnerType, PageResponse, WalletBalanceResponse, WalletResponse } from "@/lib/wallet/wallet.types";
import { formatAssetMinorMoney } from "@/lib/wallet/wallet-format";

import { WalletsTable } from "./wallets-table";

export type WalletsPageSearchParams = Promise<{
  ownerId?: string;
  page?: string;
  size?: string;
  sort?: string;
  status?: string;
}>;

type WalletsPageProps = {
  activePath: string;
  description: string;
  ownerType?: OwnerType;
  searchParams?: WalletsPageSearchParams;
  title: string;
};

const PAGE_SIZE = 20;

const WALLET_TABS = [
  { href: "/dashboard/wallets", label: "All Wallets" },
  { href: "/dashboard/wallets/customers", label: "Customer Wallets" },
  { href: "/dashboard/wallets/agents", label: "Agent Wallets" },
  { href: "/dashboard/wallets/merchants", label: "Merchant Wallets" },
];

export async function WalletsPage({ activePath, description, ownerType, searchParams, title }: WalletsPageProps) {
  const params = await searchParams;
  const page = toPageNumber(params?.page);
  const pageSize = toPageSize(params?.size);
  const sort = toWalletSort(params?.sort);
  const filters = {
    ownerId: params?.ownerId ?? "",
    status: params?.status ?? "",
  };

  try {
    const wallets = await listAdminWallets({
      ownerId: filters.ownerId || undefined,
      ownerType,
      page,
      size: pageSize,
      sort,
      status: filters.status || undefined,
    });
    const enrichedWallets = await enrichWalletPage(wallets);
    const metrics = summarizeWallets(enrichedWallets.content);

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-xs md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                  Wallet Ledger
                </Badge>
                <Badge variant="outline">{enrichedWallets.totalElements} wallets</Badge>
              </div>
              <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">{title}</h1>
              <p className="mt-1 max-w-3xl text-muted-foreground text-sm">{description}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {WALLET_TABS.map((tab) => (
              <Button
                asChild
                key={tab.href}
                size="sm"
                variant={activePath === tab.href ? "default" : "outline"}
                className="h-8"
              >
                <Link href={tab.href}>{tab.label}</Link>
              </Button>
            ))}
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={WalletCards} label="Total" value={enrichedWallets.totalElements.toString()} />
          <MetricCard icon={ShieldCheck} label="Actifs sur cette page" value={metrics.activeCount.toString()} />
          <MetricCard
            icon={Landmark}
            label="Balance Ledger page"
            value={formatAssetMinorMoney(metrics.ledgerBalanceMinor, "TND", "TND/2")}
          />
          <MetricCard icon={UsersRound} label="Owners sur cette page" value={metrics.ownerCount.toString()} />
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Registre wallets</CardTitle>
            <CardDescription>Vue tenant-safe des wallets et de leurs comptes ledger principaux.</CardDescription>
          </CardHeader>
          <CardContent>
            <WalletsTable
              basePath={activePath}
              filters={filters}
              fixedOwnerType={ownerType}
              pageSize={pageSize}
              sort={sort}
              wallets={enrichedWallets}
            />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger les wallets.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Wallets indisponibles</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Le backend wallet ne repond pas."}
          </CardContent>
        </Card>
      </div>
    );
  }
}

async function enrichWalletPage(wallets: PageResponse<WalletResponse>): Promise<PageResponse<WalletResponse>> {
  const enrichedContent = await Promise.all(wallets.content.map(enrichWalletRow));

  return {
    ...wallets,
    content: enrichedContent,
  };
}

async function enrichWalletRow(wallet: WalletResponse): Promise<WalletResponse> {
  const [balance, owner] = await Promise.all([safeGetWalletBalance(wallet), safeGetWalletOwner(wallet)]);

  return {
    ...wallet,
    ledgerAccountAddress: wallet.ledgerAccountAddress ?? balance?.accountAddress ?? null,
    ledgerAsset: wallet.ledgerAsset ?? balance?.asset ?? null,
    ledgerAvailableBalanceMinor: wallet.ledgerAvailableBalanceMinor ?? balance?.availableBalanceMinor ?? null,
    ledgerBalanceStatus: wallet.ledgerBalanceStatus ?? (balance ? "available" : "unavailable"),
    ownerDisplayName: wallet.ownerDisplayName ?? owner?.fullName ?? null,
    ownerEmail: wallet.ownerEmail ?? owner?.email ?? null,
  };
}

async function safeGetWalletBalance(wallet: WalletResponse): Promise<WalletBalanceResponse | null> {
  try {
    return await getAdminWalletBalance(wallet.id);
  } catch {
    return null;
  }
}

async function safeGetWalletOwner(wallet: WalletResponse) {
  if (wallet.ownerType !== "user" && wallet.ownerType !== "cash_agent") {
    return null;
  }

  try {
    return await getUser(wallet.ownerId);
  } catch {
    return null;
  }
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className={cn("truncate font-semibold text-xl", value.length < 10 && "text-2xl")}>{value}</p>
        </div>
        <Icon className="size-5 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function summarizeWallets(wallets: WalletResponse[]) {
  const ownerIds = new Set(wallets.map((wallet) => `${wallet.ownerType}:${wallet.ownerId}`));

  return {
    activeCount: wallets.filter((wallet) => wallet.status === "active").length,
    ledgerBalanceMinor: wallets.reduce((sum, wallet) => sum + (wallet.ledgerAvailableBalanceMinor ?? 0), 0),
    ownerCount: ownerIds.size,
  };
}

function toPageNumber(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function toPageSize(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : PAGE_SIZE;
}

function toWalletSort(value?: string) {
  const allowedSorts = new Set([
    "availableBalanceMinor,asc",
    "availableBalanceMinor,desc",
    "createdAt,asc",
    "createdAt,desc",
    "status,asc",
    "status,desc",
    "walletType,asc",
    "walletType,desc",
  ]);

  return value && allowedSorts.has(value) ? value : "createdAt,desc";
}
