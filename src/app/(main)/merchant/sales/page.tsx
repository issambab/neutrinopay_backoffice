import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMerchantSalesSummary, listMerchantOrders } from "@/lib/commerce/commerce.server";
import type { CommerceOrderStatus, CommercePaymentStatus } from "@/lib/commerce/commerce.types";
import { getMerchantWorkspace } from "@/lib/merchant/merchant.server";

import { MerchantEmptyState } from "../_components/merchant-empty-state";
import { MerchantSalesPanel } from "./merchant-sales-panel";

type MerchantSalesPageProps = {
  searchParams?: Promise<{
    from?: string;
    page?: string;
    paymentStatus?: string;
    period?: string;
    q?: string;
    size?: string;
    status?: string;
    to?: string;
  }>;
};

const ORDER_STATUSES: CommerceOrderStatus[] = ["pending", "confirmed", "preparing", "ready", "fulfilled", "cancelled"];
const PAYMENT_STATUSES: CommercePaymentStatus[] = ["unpaid", "pending", "paid", "failed", "refunded"];
const SALES_PAGE_SIZE = 10;
const SALES_SIZE_OPTIONS = [10, 20, 50];
const SALES_PERIODS = ["today", "7d", "30d", "all", "custom"] as const;

type SalesPeriod = (typeof SALES_PERIODS)[number];

export default async function MerchantSalesPage({ searchParams }: MerchantSalesPageProps) {
  const { business } = await getMerchantWorkspace();
  const query = await searchParams;

  if (!business) {
    return <MerchantEmptyState text="Aucun marchand n'est rattache a ce compte." />;
  }

  const period = parseSalesPeriod(query?.period);
  const dates = resolveSalesDateRange(period, query?.from, query?.to);
  const filters = {
    from: dates.from,
    page: parsePage(query?.page),
    paymentStatus: parsePaymentStatus(query?.paymentStatus),
    period,
    q: query?.q?.trim() ?? "",
    size: parsePageSize(query?.size),
    status: parseOrderStatus(query?.status),
    to: dates.to,
  };

  try {
    const [orders, summary] = await Promise.all([
      listMerchantOrders({
        from: filters.from || undefined,
        page: filters.page,
        paymentStatus: filters.paymentStatus || undefined,
        q: filters.q || undefined,
        size: filters.size,
        sort: "createdAt,desc",
        status: filters.status || undefined,
        to: filters.to || undefined,
      }),
      getMerchantSalesSummary({
        from: filters.from || undefined,
        paymentStatus: filters.paymentStatus || undefined,
        q: filters.q || undefined,
        status: filters.status || undefined,
        to: filters.to || undefined,
      }),
    ]);

    return <MerchantSalesPanel businessName={business.name} filters={filters} orders={orders} summary={summary} />;
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ventes indisponibles</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Impossible de charger vos ventes."}
        </CardContent>
      </Card>
    );
  }
}

function parsePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function parsePageSize(value: string | undefined) {
  const parsed = Number(value);
  return SALES_SIZE_OPTIONS.includes(parsed) ? parsed : SALES_PAGE_SIZE;
}

function parseOrderStatus(value: string | undefined): CommerceOrderStatus | "" {
  return ORDER_STATUSES.includes(value as CommerceOrderStatus) ? (value as CommerceOrderStatus) : "";
}

function parsePaymentStatus(value: string | undefined): CommercePaymentStatus | "" {
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
