"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  PackageCheck,
  ReceiptText,
  Search,
  TrendingUp,
} from "lucide-react";

import { CommerceOrderDetail } from "@/components/commerce/commerce-order-detail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
  CommerceOrderResponse,
  CommerceOrderStatus,
  CommercePaymentStatus,
  CommerceSalesSummaryResponse,
  PageResponse,
} from "@/lib/commerce/commerce.types";
import {
  formatMoney,
  formatOrderStatus,
  formatPaymentStatus,
  orderStatusClassName,
  paymentStatusClassName,
} from "@/lib/commerce/commerce-format";

type MerchantSalesPanelProps = {
  businessName: string;
  filters: {
    from: string;
    page: number;
    paymentStatus: CommercePaymentStatus | "";
    period: PeriodFilter;
    q: string;
    size: number;
    status: CommerceOrderStatus | "";
    to: string;
  };
  orders: PageResponse<CommerceOrderResponse>;
  summary: CommerceSalesSummaryResponse;
};

type PeriodFilter = "all" | "today" | "7d" | "30d" | "custom";

const ORDER_STATUSES: (CommerceOrderStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "fulfilled",
  "cancelled",
];
const PAYMENT_STATUSES: (CommercePaymentStatus | "all")[] = ["all", "unpaid", "pending", "paid", "failed", "refunded"];
const SALES_SIZE_OPTIONS = [10, 20, 50];

export function MerchantSalesPanel({ businessName, filters, orders, summary }: MerchantSalesPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fromDate, setFromDate] = useState(filters.from);
  const [paymentStatus, setPaymentStatus] = useState<CommercePaymentStatus | "all">(filters.paymentStatus || "all");
  const [period, setPeriod] = useState<PeriodFilter>(filters.period);
  const [query, setQuery] = useState(filters.q);
  const [selectedOrder, setSelectedOrder] = useState<CommerceOrderResponse | null>(null);
  const [status, setStatus] = useState<CommerceOrderStatus | "all">(filters.status || "all");
  const [toDate, setToDate] = useState(filters.to);
  const visibleOrders = orders.content;
  const totalPages = Math.max(1, orders.totalPages);
  const currentPage = Math.min(orders.page, totalPages - 1);

  useEffect(() => {
    setFromDate(filters.from);
    setPaymentStatus(filters.paymentStatus || "all");
    setPeriod(filters.period);
    setQuery(filters.q);
    setSelectedOrder(null);
    setStatus(filters.status || "all");
    setToDate(filters.to);
  }, [filters.from, filters.paymentStatus, filters.period, filters.q, filters.status, filters.to]);

  function updateFilters(updates: Partial<MerchantSalesPanelProps["filters"]>) {
    const params = new URLSearchParams(searchParams.toString());
    const nextPage = updates.page ?? filters.page;
    const nextSize = updates.size ?? filters.size;
    const nextQuery = updates.q ?? filters.q;
    const nextStatus = updates.status ?? filters.status;
    const nextPaymentStatus = updates.paymentStatus ?? filters.paymentStatus;
    const nextPeriod = updates.period ?? filters.period;
    const nextFrom = updates.from ?? filters.from;
    const nextTo = updates.to ?? filters.to;

    if (nextPage > 0) {
      params.set("page", String(nextPage));
    } else {
      params.delete("page");
    }

    if (SALES_SIZE_OPTIONS.includes(nextSize) && nextSize !== SALES_SIZE_OPTIONS[0]) {
      params.set("size", String(nextSize));
    } else {
      params.delete("size");
    }

    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    } else {
      params.delete("q");
    }

    if (nextStatus) {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }

    if (nextPaymentStatus) {
      if (nextPaymentStatus === "paid") {
        params.delete("paymentStatus");
      } else {
        params.set("paymentStatus", nextPaymentStatus);
      }
    } else {
      params.set("paymentStatus", "all");
    }

    if (nextPeriod === "30d") {
      params.delete("period");
    } else {
      params.set("period", nextPeriod);
    }

    if (nextPeriod === "custom") {
      if (nextFrom) {
        params.set("from", nextFrom);
      } else {
        params.delete("from");
      }

      if (nextTo) {
        params.set("to", nextTo);
      } else {
        params.delete("to");
      }
    } else {
      params.delete("from");
      params.delete("to");
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function updatePeriod(nextPeriod: PeriodFilter) {
    setPeriod(nextPeriod);
    if (nextPeriod !== "custom") {
      setFromDate("");
      setToDate("");
    }
    updateFilters({
      from: "",
      page: 0,
      period: nextPeriod,
      to: "",
    });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateFilters({ page: 0, q: query });
  }

  function exportCsv() {
    const params = new URLSearchParams();
    appendFilterParam(params, "status", filters.status);
    appendFilterParam(params, "paymentStatus", filters.paymentStatus);
    appendFilterParam(params, "q", filters.q);
    appendFilterParam(params, "from", filters.from);
    appendFilterParam(params, "to", filters.to);
    const queryString = params.toString();
    window.location.assign(`/api/merchant/commerce/sales-export${queryString ? `?${queryString}` : ""}`);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Ventes</h1>
          <p className="text-muted-foreground text-sm">
            Suivi chiffre d'affaires, panier moyen et commandes vendues pour {businessName}.
          </p>
        </div>
        <Button disabled={orders.totalElements === 0} onClick={exportCsv} variant="outline">
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={TrendingUp} label="CA encaisse" value={formatMoney(summary.paidRevenue, summary.currency)} />
        <MetricCard icon={ReceiptText} label="Commandes payees" value={String(summary.paidOrders)} />
        <MetricCard
          icon={PackageCheck}
          label="Panier moyen"
          value={formatMoney(summary.averagePaidBasket, summary.currency)}
        />
        <MetricCard icon={Ban} label="Annulees" value={String(summary.cancelledOrders)} />
      </div>

      <Card>
        <CardHeader className="gap-3 border-b">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <CardTitle>Historique ventes</CardTitle>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_170px_170px_160px_minmax(260px,1fr)]">
              <form className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]" onSubmit={submitSearch}>
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Commande, client, telephone"
                    value={query}
                  />
                </div>
                <Button type="submit" variant="outline">
                  Rechercher
                </Button>
              </form>
              <NativeSelect
                onChange={(event) => {
                  const value = event.target.value as CommerceOrderStatus | "all";
                  setStatus(value);
                  updateFilters({ page: 0, status: value === "all" ? "" : value });
                }}
                value={status}
              >
                {ORDER_STATUSES.map((item) => (
                  <NativeSelectOption key={item} value={item}>
                    {item === "all" ? "Tous les statuts" : formatOrderStatus(item)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect
                onChange={(event) => {
                  const value = event.target.value as CommercePaymentStatus | "all";
                  setPaymentStatus(value);
                  updateFilters({ page: 0, paymentStatus: value === "all" ? "" : value });
                }}
                value={paymentStatus}
              >
                {PAYMENT_STATUSES.map((item) => (
                  <NativeSelectOption key={item} value={item}>
                    {item === "all" ? "Tous paiements" : formatPaymentStatus(item)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect onChange={(event) => updatePeriod(event.target.value as PeriodFilter)} value={period}>
                <NativeSelectOption value="today">Aujourd'hui</NativeSelectOption>
                <NativeSelectOption value="7d">7 derniers jours</NativeSelectOption>
                <NativeSelectOption value="30d">30 derniers jours</NativeSelectOption>
                <NativeSelectOption value="all">Toutes les dates</NativeSelectOption>
                <NativeSelectOption value="custom">Periode precise</NativeSelectOption>
              </NativeSelect>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <Input
                  disabled={period !== "custom"}
                  onChange={(event) => setFromDate(event.target.value)}
                  type="date"
                  value={fromDate}
                />
                <Input
                  disabled={period !== "custom"}
                  onChange={(event) => setToDate(event.target.value)}
                  type="date"
                  value={toDate}
                />
                <Button
                  disabled={period !== "custom"}
                  onClick={() =>
                    updateFilters({
                      from: fromDate,
                      page: 0,
                      period: "custom",
                      to: toDate,
                    })
                  }
                  type="button"
                  variant="outline"
                >
                  Appliquer
                </Button>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            {visibleOrders.length} commande(s) affichee(s) sur {orders.totalElements}
          </p>
        </CardHeader>
        <CardContent>
          {visibleOrders.length === 0 ? (
            <EmptyPanel text="Aucune vente ne correspond aux filtres." />
          ) : (
            <div className="grid gap-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-12 text-right">Voir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleOrders.map((order) => (
                    <TableRow
                      className="cursor-pointer"
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedOrder(order);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <TableCell>
                        <div className="font-medium">{order.orderNumber}</div>
                        <div className="text-muted-foreground text-xs">{order.items.length} ligne(s)</div>
                      </TableCell>
                      <TableCell>
                        <div>{order.customerName}</div>
                        <div className="text-muted-foreground text-xs">{order.customerPhone}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={orderStatusClassName(order.status)} variant="outline">
                          {formatOrderStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={paymentStatusClassName(order.paymentStatus)} variant="outline">
                          {formatPaymentStatus(order.paymentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(order.totalAmount, order.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          aria-label={`Voir le detail de la commande ${order.orderNumber}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  Page {currentPage + 1} sur {totalPages} - {orders.totalElements} vente(s)
                </p>
                <div className="flex flex-wrap gap-2">
                  <NativeSelect
                    onChange={(event) =>
                      updateFilters({
                        page: 0,
                        size: Number(event.target.value),
                      })
                    }
                    value={String(filters.size)}
                  >
                    {SALES_SIZE_OPTIONS.map((size) => (
                      <NativeSelectOption key={size} value={String(size)}>
                        {size} par page
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <Button
                    disabled={orders.first}
                    onClick={() => updateFilters({ page: Math.max(0, currentPage - 1) })}
                    size="sm"
                    variant="outline"
                  >
                    <ChevronLeft className="size-4" />
                    Precedent
                  </Button>
                  <Button
                    disabled={orders.last}
                    onClick={() => updateFilters({ page: Math.min(totalPages - 1, currentPage + 1) })}
                    size="sm"
                    variant="outline"
                  >
                    Suivant
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailDialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
          }
        }}
        order={selectedOrder}
      />
    </div>
  );
}

function OrderDetailDialog({
  onOpenChange,
  order,
}: {
  onOpenChange: (open: boolean) => void;
  order: CommerceOrderResponse | null;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(order)}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{order?.orderNumber ?? "Detail commande"}</DialogTitle>
          <DialogDescription>Detail client, produits commandes et historique de traitement.</DialogDescription>
        </DialogHeader>
        {order ? (
          <div className="grid max-h-[72vh] gap-4 overflow-y-auto pr-1">
            <CommerceOrderDetail order={order} paymentIntentScope="merchant" readonly variant="dialog" />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="font-semibold text-2xl">{value}</p>
        </div>
        <div className="rounded-md bg-muted p-2">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">{text}</div>;
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

function appendFilterParam(params: URLSearchParams, key: string, value: string) {
  if (value.trim()) {
    params.set(key, value.trim());
  }
}
