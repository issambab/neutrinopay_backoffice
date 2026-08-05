import type { ComponentType } from "react";

import Link from "next/link";

import { ArrowLeft, Boxes, PackageCheck, ReceiptText, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAdminBusinessSalesSummary,
  getAdminCommerceStore,
  listAdminBusinessOrders,
  listAdminBusinessProductCategories,
  listAdminBusinessProducts,
} from "@/lib/commerce/commerce.server";
import type { CommerceOrderStatus, CommercePaymentStatus } from "@/lib/commerce/commerce.types";
import { formatCommerceStatus } from "@/lib/commerce/commerce-format";

import { StoresAdminPanel } from "../_components/stores-admin-panel";

type StoreDetailPageProps = {
  params: Promise<{
    storeId: string;
  }>;
  searchParams?: Promise<{
    ordersPage?: string;
    ordersQ?: string;
    ordersSize?: string;
    ordersStatus?: string;
    productsPage?: string;
    productsQ?: string;
    productsSize?: string;
    salesFrom?: string;
    salesPage?: string;
    salesPaymentStatus?: string;
    salesPeriod?: string;
    salesQ?: string;
    salesSize?: string;
    salesStatus?: string;
    salesTo?: string;
    tab?: string;
  }>;
};

const PRODUCT_PAGE_SIZE = 8;
const PRODUCT_SIZE_OPTIONS = [8, 16, 32];
const ORDER_PAGE_SIZE = 8;
const ORDER_SIZE_OPTIONS = [8, 16, 32];
const ORDER_STATUSES: CommerceOrderStatus[] = ["pending", "confirmed", "preparing", "ready", "fulfilled", "cancelled"];
const SALES_PAGE_SIZE = 10;
const SALES_SIZE_OPTIONS = [10, 20, 50];
const PAYMENT_STATUSES: CommercePaymentStatus[] = ["unpaid", "pending", "paid", "failed", "refunded"];
const SALES_PERIODS = ["today", "7d", "30d", "all", "custom"] as const;

type SalesPeriod = (typeof SALES_PERIODS)[number];

export default async function StoreDetailPage({ params, searchParams }: StoreDetailPageProps) {
  const { storeId } = await params;
  const query = await searchParams;
  const productFilters = {
    page: parsePage(query?.productsPage),
    q: query?.productsQ?.trim() ?? "",
    size: parsePageSize(query?.productsSize),
  };
  const orderFilters = {
    page: parsePage(query?.ordersPage),
    q: query?.ordersQ?.trim() ?? "",
    size: parseOrderPageSize(query?.ordersSize),
    status: parseOrderStatus(query?.ordersStatus),
  };
  const salesPeriod = parseSalesPeriod(query?.salesPeriod);
  const salesDates = resolveSalesDateRange(salesPeriod, query?.salesFrom, query?.salesTo);
  const salesFilters = {
    from: salesDates.from,
    page: parsePage(query?.salesPage),
    paymentStatus: parseSalesPaymentStatus(query?.salesPaymentStatus),
    period: salesPeriod,
    q: query?.salesQ?.trim() ?? "",
    size: parseSalesPageSize(query?.salesSize),
    status: parseOrderStatus(query?.salesStatus),
    to: salesDates.to,
  };

  try {
    const selectedStore = await getAdminCommerceStore(storeId);
    const [categories, products, orders, salesOrders, salesSummary, pendingOrdersPage] = await Promise.all([
      listAdminBusinessProductCategories(selectedStore.businessId, { size: 100, sort: "sortOrder,asc" }),
      listAdminBusinessProducts(selectedStore.businessId, {
        page: productFilters.page,
        q: productFilters.q || undefined,
        size: productFilters.size,
        sort: "createdAt,desc",
      }),
      listAdminBusinessOrders(selectedStore.businessId, {
        page: orderFilters.page,
        q: orderFilters.q || undefined,
        size: orderFilters.size,
        sort: "createdAt,desc",
        status: orderFilters.status || undefined,
      }),
      listAdminBusinessOrders(selectedStore.businessId, {
        from: salesFilters.from || undefined,
        page: salesFilters.page,
        paymentStatus: salesFilters.paymentStatus || undefined,
        q: salesFilters.q || undefined,
        size: salesFilters.size,
        sort: "createdAt,desc",
        status: salesFilters.status || undefined,
        to: salesFilters.to || undefined,
      }),
      getAdminBusinessSalesSummary(selectedStore.businessId, {
        from: salesFilters.from || undefined,
        paymentStatus: salesFilters.paymentStatus || undefined,
        q: salesFilters.q || undefined,
        status: salesFilters.status || undefined,
        to: salesFilters.to || undefined,
      }),
      listAdminBusinessOrders(selectedStore.businessId, { page: 0, size: 1, status: "pending" }),
    ]);
    const pendingOrders = pendingOrdersPage.totalElements;

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Button asChild className="mb-3" size="sm" variant="outline">
              <Link href="/dashboard/stores">
                <ArrowLeft className="size-4" />
                Boutiques
              </Link>
            </Button>
            <h1 className="font-semibold text-2xl tracking-tight">{selectedStore.displayName}</h1>
            <p className="text-muted-foreground text-sm">Detail boutique marchand, catalogue, commandes et ventes.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard icon={Store} label="Statut boutique" value={formatCommerceStatus(selectedStore.status)} />
          <MetricCard icon={PackageCheck} label="Produits" value={products.totalElements.toString()} />
          <MetricCard icon={Boxes} label="Categories" value={categories.totalElements.toString()} />
          <MetricCard icon={ReceiptText} label="Commandes attente" value={pendingOrders.toString()} />
        </div>

        <StoresAdminPanel
          categories={categories.content}
          orderFilters={orderFilters}
          orders={orders.content}
          ordersPage={orders}
          pendingOrders={pendingOrders}
          productFilters={productFilters}
          products={products}
          salesFilters={salesFilters}
          salesOrders={salesOrders.content}
          salesOrdersPage={salesOrders}
          salesSummary={salesSummary}
          selectedStore={selectedStore}
        />
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <Button asChild className="mb-3" size="sm" variant="outline">
            <Link href="/dashboard/stores">
              <ArrowLeft className="size-4" />
              Boutiques
            </Link>
          </Button>
          <h1 className="font-semibold text-2xl tracking-tight">Detail boutique</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger cette boutique.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acces indisponible</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Le backend commerce ne repond pas."}
          </CardContent>
        </Card>
      </div>
    );
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
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="font-semibold text-2xl">{value}</p>
        </div>
        <Icon className="size-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function parsePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function parsePageSize(value: string | undefined) {
  const parsed = Number(value);
  return PRODUCT_SIZE_OPTIONS.includes(parsed) ? parsed : PRODUCT_PAGE_SIZE;
}

function parseOrderPageSize(value: string | undefined) {
  const parsed = Number(value);
  return ORDER_SIZE_OPTIONS.includes(parsed) ? parsed : ORDER_PAGE_SIZE;
}

function parseSalesPageSize(value: string | undefined) {
  const parsed = Number(value);
  return SALES_SIZE_OPTIONS.includes(parsed) ? parsed : SALES_PAGE_SIZE;
}

function parseOrderStatus(value: string | undefined): CommerceOrderStatus | "" {
  return ORDER_STATUSES.includes(value as CommerceOrderStatus) ? (value as CommerceOrderStatus) : "";
}

function parseSalesPaymentStatus(value: string | undefined): CommercePaymentStatus | "" {
  if (value === "all") {
    return "";
  }
  return PAYMENT_STATUSES.includes(value as CommercePaymentStatus) ? (value as CommercePaymentStatus) : "paid";
}

function parseSalesPeriod(value: string | undefined): SalesPeriod {
  return SALES_PERIODS.includes(value as SalesPeriod) ? (value as SalesPeriod) : "30d";
}

function resolveSalesDateRange(period: SalesPeriod, from: string | undefined, to: string | undefined) {
  const today = new Date();

  if (period === "today") {
    const value = dateInputValue(today);
    return { from: value, to: value };
  }

  if (period === "7d") {
    return { from: dateInputValue(addDays(today, -6)), to: dateInputValue(today) };
  }

  if (period === "30d") {
    return { from: dateInputValue(addDays(today, -29)), to: dateInputValue(today) };
  }

  if (period === "custom") {
    return {
      from: isDateInputValue(from) ? from : "",
      to: isDateInputValue(to) ? to : "",
    };
  }

  return { from: "", to: "" };
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function dateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

function isDateInputValue(value: string | undefined): value is string {
  return Boolean(value?.match(/^\d{4}-\d{2}-\d{2}$/));
}
