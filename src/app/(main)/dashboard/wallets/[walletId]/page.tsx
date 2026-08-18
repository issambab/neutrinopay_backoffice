import Link from "next/link";

import { ArrowLeft, Landmark, ReceiptText, UserRound, WalletCards } from "lucide-react";

import { UserWalletCard } from "@/app/(main)/dashboard/users/[userId]/_components/user-wallet-card";
import { UserWalletLedgerCard } from "@/app/(main)/dashboard/users/[userId]/_components/user-wallet-ledger-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAdminWallet,
  getAdminWalletBalance,
  getAdminWalletReconciliation,
  listAdminWalletTransactions,
} from "@/lib/wallet/wallet.server";
import type {
  PageResponse,
  WalletBalanceResponse,
  WalletReconciliationResponse,
  WalletTransactionResponse,
} from "@/lib/wallet/wallet.types";
import { formatAssetMinorMoney, formatWalletEnum, walletStatusClassName } from "@/lib/wallet/wallet-format";

import { WalletMovementsCard } from "./_components/wallet-movements-card";

type WalletDetailPageProps = {
  params: Promise<{
    walletId: string;
  }>;
  searchParams?: Promise<{
    txPage?: string;
    txSize?: string;
    txSort?: string;
  }>;
};

const DEFAULT_MOVEMENTS_PAGE_SIZE = 10;

export default async function WalletDetailPage({ params, searchParams }: WalletDetailPageProps) {
  const { walletId } = await params;
  const query = await searchParams;
  const txPage = toPageNumber(query?.txPage);
  const txSize = toPageSize(query?.txSize);
  const txSort = toTransactionSort(query?.txSort);

  try {
    const wallet = await getAdminWallet(walletId);
    const [balance, reconciliation, transactions] = await Promise.all([
      safeGetWalletBalance(wallet.id),
      safeGetWalletReconciliation(wallet.id),
      safeGetWalletTransactions(wallet.id, txPage, txSize, txSort),
    ]);
    const ownerLabel = wallet.ownerDisplayName ?? wallet.ownerEmail ?? wallet.ownerId;

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-xs md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                  Wallet detail
                </Badge>
                <Badge className={walletStatusClassName(wallet.status)} variant="outline">
                  {formatWalletEnum(wallet.status)}
                </Badge>
                <Badge variant="secondary">{formatWalletEnum(wallet.walletType)}</Badge>
              </div>
              <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">
                {wallet.label ?? formatWalletEnum(wallet.walletType)}
              </h1>
              <p className="mt-1 max-w-3xl break-all text-muted-foreground text-sm">{wallet.id}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/wallets">
                  <ArrowLeft />
                  All Wallets
                </Link>
              </Button>
              {wallet.ownerType === "user" ? (
                <Button asChild size="sm">
                  <Link href={`/dashboard/users/${wallet.ownerId}`}>Ouvrir client</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <HeaderMetric
              icon={UserRound}
              label="Owner"
              value={ownerLabel}
              detail={wallet.ownerEmail ?? wallet.ownerType}
            />
            <HeaderMetric
              icon={Landmark}
              label="Balance Ledger"
              value={
                balance
                  ? formatAssetMinorMoney(balance.availableBalanceMinor, balance.currency, balance.asset)
                  : "Indisponible"
              }
              detail={balance?.accountAddress ?? "Compte non lisible"}
            />
            <HeaderMetric
              icon={WalletCards}
              label="Comptes"
              value={wallet.accounts.length.toString()}
              detail={wallet.defaultCurrency}
            />
            <HeaderMetric
              icon={ReceiptText}
              label="Mouvements"
              value={transactions ? transactions.totalElements.toString() : "-"}
              detail="Operations postees"
            />
          </div>
        </section>

        <UserWalletCard wallet={wallet} />
        <UserWalletLedgerCard balance={balance} reconciliation={reconciliation} wallet={wallet} />
        <WalletMovementsCard pageSize={txSize} transactions={transactions} />
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Detail wallet</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger ce wallet.</p>
        </div>
        <Card>
          <CardContent className="p-6 text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Le backend wallet ne repond pas."}
          </CardContent>
        </Card>
      </div>
    );
  }
}

function HeaderMetric({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: typeof Landmark;
  label: string;
  value: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="truncate font-semibold text-xl">{value}</p>
          <p className="truncate text-muted-foreground text-xs">{detail}</p>
        </div>
        <Icon className="mt-1 size-5 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

async function safeGetWalletBalance(walletId: string): Promise<WalletBalanceResponse | null> {
  try {
    return await getAdminWalletBalance(walletId);
  } catch {
    return null;
  }
}

async function safeGetWalletReconciliation(walletId: string): Promise<WalletReconciliationResponse | null> {
  try {
    return await getAdminWalletReconciliation(walletId);
  } catch {
    return null;
  }
}

async function safeGetWalletTransactions(
  walletId: string,
  page: number,
  size: number,
  sort: string,
): Promise<PageResponse<WalletTransactionResponse> | null> {
  try {
    return await listAdminWalletTransactions(walletId, { page, size, sort });
  } catch {
    return null;
  }
}

function toPageNumber(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function toPageSize(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_MOVEMENTS_PAGE_SIZE;
}

function toTransactionSort(value?: string) {
  const allowedSorts = new Set(["amountMinor,asc", "amountMinor,desc", "createdAt,asc", "createdAt,desc"]);

  return value && allowedSorts.has(value) ? value : "createdAt,desc";
}
