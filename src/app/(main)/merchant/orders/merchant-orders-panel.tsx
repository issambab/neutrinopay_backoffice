"use client";

import { useMemo, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, PackageCheck, Phone, Search } from "lucide-react";
import { toast } from "sonner";

import { CommerceOrderDetail } from "@/components/commerce/commerce-order-detail";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { CommerceOrderResponse, CommerceOrderStatus } from "@/lib/commerce/commerce.types";
import {
  formatMoney,
  formatOrderStatus,
  formatPaymentStatus,
  orderStatusClassName,
  paymentStatusClassName,
} from "@/lib/commerce/commerce-format";

type MerchantOrdersPanelProps = {
  initialStatus: CommerceOrderStatus | "all";
  orders: CommerceOrderResponse[];
  pendingOrdersCount: number;
};

const ORDER_STATUSES: (CommerceOrderStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "fulfilled",
  "cancelled",
];
const ORDER_PAGE_SIZE = 8;

export function MerchantOrdersPanel({ initialStatus, orders, pendingOrdersCount }: MerchantOrdersPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentOrders, setCurrentOrders] = useState(orders);
  const [isBusy, setIsBusy] = useState(false);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id ?? "");
  const [status, setStatus] = useState<CommerceOrderStatus | "all">(initialStatus);
  const filteredOrders = useMemo(() => filterOrders(currentOrders, status, query), [currentOrders, query, status]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDER_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedOrders = filteredOrders.slice(
    currentPage * ORDER_PAGE_SIZE,
    currentPage * ORDER_PAGE_SIZE + ORDER_PAGE_SIZE,
  );
  const selectedOrder =
    currentOrders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0] ?? currentOrders[0] ?? null;
  const metrics = buildMetrics(currentOrders);

  function updateStatusFilter(nextStatus: CommerceOrderStatus | "all") {
    setStatus(nextStatus);
    setPage(0);
    const params = new URLSearchParams(searchParams.toString());
    if (nextStatus === "all") {
      params.delete("status");
    } else {
      params.set("status", nextStatus);
    }
    router.push(params.toString() ? `${pathname}?${params}` : pathname);
  }

  async function changeStatus(form: HTMLFormElement, order: CommerceOrderResponse, nextStatus: CommerceOrderStatus) {
    setIsBusy(true);
    try {
      const formData = new FormData(form);
      const response = await fetch(`/api/merchant/commerce/orders/${order.id}/status`, {
        body: JSON.stringify({
          message: textValue(formData, "message"),
          metadata: {
            source: "merchant_orders_panel",
          },
          status: nextStatus,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        order?: CommerceOrderResponse;
      } | null;

      if (!response.ok || !result?.order) {
        toast.error(result?.message ?? "Impossible de changer le statut.");
        return;
      }

      setCurrentOrders((items) => items.map((item) => (item.id === result.order?.id ? result.order : item)));
      setSelectedOrderId(result.order.id);
      toast.success("Statut commande mis a jour.");
      form.reset();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Commandes</h1>
          <p className="text-muted-foreground text-sm">Suivez les commandes recues depuis votre boutique publique.</p>
        </div>
      </div>

      {pendingOrdersCount > 0 ? (
        <Alert className="border-amber-500/30 bg-amber-500/10">
          <Clock3 className="size-4 text-amber-700" />
          <AlertTitle>{pendingOrdersCount} commande(s) attendent votre confirmation</AlertTitle>
          <AlertDescription>
            Traitez les commandes en attente pour informer le client et avancer le suivi public.
          </AlertDescription>
          <AlertAction>
            <Button onClick={() => updateStatusFilter("pending")} size="sm" type="button" variant="outline">
              Voir
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <div className="grid gap-3 md:grid-cols-5">
        <MetricCard icon={Clock3} label="En attente" value={String(metrics.pending)} />
        <MetricCard icon={CheckCircle2} label="Confirmees" value={String(metrics.confirmed)} />
        <MetricCard icon={PackageCheck} label="Preparation" value={String(metrics.preparing)} />
        <MetricCard icon={PackageCheck} label="Pretes" value={String(metrics.ready)} />
        <MetricCard icon={PackageCheck} label="Livrees" value={String(metrics.fulfilled)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="self-start">
          <CardHeader className="gap-3 border-b">
            <CardTitle>File commandes</CardTitle>
            <div className="grid gap-2">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => {
                    setPage(0);
                    setQuery(event.target.value);
                  }}
                  placeholder="Recherche numero, client ou telephone"
                  value={query}
                />
              </div>
              <NativeSelect
                onChange={(event) => updateStatusFilter(event.target.value as CommerceOrderStatus | "all")}
                value={status}
              >
                {ORDER_STATUSES.map((item) => (
                  <NativeSelectOption key={item} value={item}>
                    {item === "all" ? "Tous les statuts" : formatOrderStatus(item)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {filteredOrders.length === 0 ? (
              <EmptyPanel text="Aucune commande ne correspond aux filtres." />
            ) : (
              <>
                <div className="grid gap-2">
                  {paginatedOrders.map((order) => (
                    <button
                      className={`rounded-md border p-3 text-left transition hover:bg-muted/50 ${
                        selectedOrder?.id === order.id ? "border-primary bg-muted" : ""
                      }`}
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-sm">{order.orderNumber}</div>
                          <div className="truncate text-muted-foreground text-xs">{order.customerName}</div>
                        </div>
                        <Badge className={orderStatusClassName(order.status)} variant="outline">
                          {formatOrderStatus(order.status)}
                        </Badge>
                        <Badge className={paymentStatusClassName(order.paymentStatus)} variant="outline">
                          {formatPaymentStatus(order.paymentStatus)}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-1 truncate text-muted-foreground">
                          <Phone className="size-3.5" />
                          {order.customerPhone}
                        </span>
                        <span className="font-medium">{formatMoney(order.totalAmount, order.currency)}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-muted-foreground text-sm">
                    Page {currentPage + 1} sur {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      disabled={currentPage === 0}
                      onClick={() => setPage((value) => Math.max(0, value - 1))}
                      size="sm"
                      variant="outline"
                    >
                      <ChevronLeft className="size-4" />
                      Precedent
                    </Button>
                    <Button
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
                      size="sm"
                      variant="outline"
                    >
                      Suivant
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {selectedOrder ? (
          <CommerceOrderDetail
            isBusy={isBusy}
            onStatusChange={changeStatus}
            order={selectedOrder}
            paymentIntentScope="merchant"
          />
        ) : (
          <Card>
            <CardContent>
              <EmptyPanel text="Selectionnez une commande pour afficher le detail." />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
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

function filterOrders(orders: CommerceOrderResponse[], status: CommerceOrderStatus | "all", query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  return orders.filter((order) => {
    const matchesStatus = status === "all" || order.status === status;
    const matchesQuery =
      !normalizedQuery ||
      order.orderNumber.toLowerCase().includes(normalizedQuery) ||
      order.customerName.toLowerCase().includes(normalizedQuery) ||
      order.customerPhone.toLowerCase().includes(normalizedQuery);

    return matchesStatus && matchesQuery;
  });
}

function buildMetrics(orders: CommerceOrderResponse[]) {
  return {
    confirmed: orders.filter((order) => order.status === "confirmed").length,
    fulfilled: orders.filter((order) => order.status === "fulfilled").length,
    pending: orders.filter((order) => order.status === "pending").length,
    preparing: orders.filter((order) => order.status === "preparing").length,
    ready: orders.filter((order) => order.status === "ready").length,
  };
}

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
