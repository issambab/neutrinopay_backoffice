import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMerchantSalesSummary, listMerchantOrders } from "@/lib/commerce/commerce.server";
import type { CommerceSalesSummaryResponse } from "@/lib/commerce/commerce.types";
import { formatMoney } from "@/lib/commerce/commerce-format";
import { formatKycEnum, kycStatusClassName } from "@/lib/kyc/kyc-format";
import { getMerchantWorkspace } from "@/lib/merchant/merchant.server";
import { formatEnum, statusClassName } from "@/lib/merchant/merchant-format";
import { getCurrentMerchantWallet } from "@/lib/wallet/wallet.server";
import type { WalletResponse } from "@/lib/wallet/wallet.types";
import { formatAssetMinorMoney } from "@/lib/wallet/wallet-format";

import { MerchantEmptyState } from "../_components/merchant-empty-state";
import { MerchantPendingOrdersCard } from "./merchant-pending-orders-card";
import { MerchantRecentSalesCard } from "./merchant-recent-sales-card";

export default async function MerchantDashboardPage() {
  const { business, pointsOfSale, stations, terminals } = await getMerchantWorkspace();
  const [merchantWallet, todaySummary, pendingOrders, recentSales] = await Promise.all([
    getMerchantWallet(),
    getTodaySalesSummary(),
    getPendingOrders(),
    getRecentSales(),
  ]);

  if (!business) {
    return <MerchantEmptyState text="Aucun marchand n'est rattache a ce compte." />;
  }

  const activeStations = stations.filter((station) => station.status === "active").length;
  const activePointsOfSale = pointsOfSale.filter((pointOfSale) => pointOfSale.status === "active").length;
  const activeTerminals = terminals.filter((terminal) => terminal.status === "active").length;

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{business.name}</h1>
          <p className="text-muted-foreground text-sm">Vue d'ensemble de votre activite marchand.</p>
        </div>
        <Badge variant="outline" className={statusClassName(business.status)}>
          {formatEnum(business.status)}
        </Badge>
        <Badge variant="outline" className={kycStatusClassName(business.kycStatus ?? "not_started")}>
          KYB {formatKycEnum(business.kycStatus ?? "not_started")}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          hint={merchantWalletBalanceHint(merchantWallet)}
          label="Solde wallet marchand"
          value={formatMerchantWalletBalance(merchantWallet)}
        />
        <MetricCard
          label="Net encaisse aujourd'hui"
          value={formatMoney(todaySummary.netRevenue, todaySummary.currency)}
        />
        <MetricCard
          hint={`${todaySummary.walletChangeCount} rendu(s) wallet`}
          label="Rendu wallet aujourd'hui"
          value={formatMoney(todaySummary.walletChangeAmount, todaySummary.currency)}
        />
        <MetricCard
          label="Remboursements aujourd'hui"
          value={formatMoney(todaySummary.refundedAmount, todaySummary.currency)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Stations actives" value={`${activeStations}/${stations.length}`} />
        <MetricCard label="Points de vente actifs" value={`${activePointsOfSale}/${pointsOfSale.length}`} />
        <MetricCard label="Terminaux actifs" value={`${activeTerminals}/${terminals.length}`} />
        <MetricCard label="KYB" value={formatKycEnum(business.kycStatus ?? "not_started")} />
      </div>

      <MerchantPendingOrdersCard orders={pendingOrders.content} total={pendingOrders.totalElements} />

      <MerchantRecentSalesCard orders={recentSales.content} total={recentSales.totalElements} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Identite du commerce</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <Info label="Nom commercial" value={business.name} />
            <Info label="Type activite" value={formatEnum(business.businessType)} />
            <Info label="Reference externe" value={business.externalReference ?? "-"} />
            <Info label="Registre commerce" value={business.registrationNumber ?? "-"} />
            <Info label="Identifiant fiscal" value={business.taxIdentifier ?? "-"} />
            <Info label="Statut operationnel" value={formatEnum(business.status)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Info label="Email contact" value={business.contactEmail ?? "-"} />
            <Info label="Telephone" value={business.contactPhone ?? "-"} />
            <Info label="Pays" value={business.countryCode ?? "-"} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Adresse</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Info label="Adresse" value={business.addressLine1 ?? "-"} />
            <Info label="Complement" value={business.addressLine2 ?? "-"} />
            <Info label="Ville" value={business.city ?? "-"} />
            <Info label="Region" value={business.region ?? "-"} />
            <Info label="Zone" value={business.zone ?? "-"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Couverture operationnelle</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <Info label="Stations" value={`${stations.length} total, ${activeStations} actives`} />
            <Info label="Points de vente" value={`${pointsOfSale.length} total, ${activePointsOfSale} actifs`} />
            <Info label="Terminaux" value={`${terminals.length} total, ${activeTerminals} actifs`} />
            <Info label="Derniere mise a jour" value={formatDate(business.updatedAt ?? business.createdAt)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function getMerchantWallet() {
  try {
    return await getCurrentMerchantWallet();
  } catch {
    return null;
  }
}

async function getTodaySalesSummary() {
  const today = formatInputDate(new Date());
  try {
    return await getMerchantSalesSummary({
      from: today,
      to: today,
    });
  } catch {
    return emptySalesSummary();
  }
}

async function getPendingOrders() {
  try {
    return await listMerchantOrders({
      page: 0,
      size: 5,
      sort: "createdAt,desc",
      status: "pending",
    });
  } catch {
    return {
      content: [],
      empty: true,
      first: true,
      last: true,
      page: 0,
      size: 5,
      totalElements: 0,
      totalPages: 0,
    };
  }
}

async function getRecentSales() {
  try {
    return await listMerchantOrders({
      page: 0,
      paymentStatus: "paid",
      size: 8,
      sort: "updatedAt,desc",
    });
  } catch {
    return {
      content: [],
      empty: true,
      first: true,
      last: true,
      page: 0,
      size: 8,
      totalElements: 0,
      totalPages: 0,
    };
  }
}

function MetricCard({ hint, label, value }: { hint?: string; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="grid gap-1">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="font-semibold text-2xl">{value}</span>
        {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/15 p-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatInputDate(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function emptySalesSummary(): CommerceSalesSummaryResponse {
  return {
    averagePaidBasket: 0,
    cancelledOrders: 0,
    cashChangeAmount: 0,
    currency: "TND",
    failedPaymentOrders: 0,
    netRevenue: 0,
    paidOrders: 0,
    paidRevenue: 0,
    pendingPaymentOrders: 0,
    refundedAmount: 0,
    refundedOrders: 0,
    totalOrders: 0,
    unpaidPaymentOrders: 0,
    walletChangeAmount: 0,
    walletChangeCount: 0,
  };
}

function formatMerchantWalletBalance(wallet: WalletResponse | null) {
  if (!wallet) {
    return "-";
  }

  const asset = wallet.ledgerAsset ?? wallet.accounts[0]?.asset ?? `${wallet.defaultCurrency}/2`;
  const currency = asset.split("/")[0] || wallet.defaultCurrency || "TND";
  const amountMinor = wallet.ledgerAvailableBalanceMinor ?? wallet.availableBalanceMinor;
  return formatAssetMinorMoney(amountMinor, currency, asset);
}

function merchantWalletBalanceHint(wallet: WalletResponse | null) {
  if (!wallet) {
    return "Wallet marchand indisponible";
  }
  if (wallet.ledgerBalanceStatus === "available") {
    return "Solde Formance disponible";
  }
  return "Solde local, Formance indisponible";
}
