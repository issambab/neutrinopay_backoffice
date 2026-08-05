"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CommerceOrderResponse, CommerceOrderStatus } from "@/lib/commerce/commerce.types";
import { formatMoney, formatPaymentStatus, paymentStatusClassName } from "@/lib/commerce/commerce-format";

type MerchantPendingOrdersCardProps = {
  orders: CommerceOrderResponse[];
  total: number;
};

export function MerchantPendingOrdersCard({ orders, total }: MerchantPendingOrdersCardProps) {
  const router = useRouter();
  const [busyOrderId, setBusyOrderId] = useState("");
  const [visibleOrders, setVisibleOrders] = useState(orders);

  async function changeStatus(order: CommerceOrderResponse, status: CommerceOrderStatus) {
    setBusyOrderId(order.id);
    try {
      const response = await fetch(`/api/merchant/commerce/orders/${order.id}/status`, {
        body: JSON.stringify({
          message:
            status === "confirmed"
              ? "Commande confirmee depuis le dashboard."
              : "Commande annulee depuis le dashboard.",
          metadata: {
            source: "merchant_dashboard_pending_orders",
          },
          status,
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
        toast.error(result?.message ?? "Impossible de traiter la commande.");
        return;
      }

      setVisibleOrders((items) => items.filter((item) => item.id !== order.id));
      toast.success(status === "confirmed" ? "Commande confirmee." : "Commande annulee.");
      router.refresh();
    } finally {
      setBusyOrderId("");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 border-b sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="size-5 text-amber-600" />
            Commandes a traiter
          </CardTitle>
          <p className="mt-1 text-muted-foreground text-sm">
            {total > 0 ? `${total} commande(s) attendent une decision.` : "Aucune commande en attente."}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/merchant/orders?status=pending">Voir toutes</Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3">
        {visibleOrders.length === 0 ? (
          <div className="rounded-md border border-dashed p-5 text-center text-muted-foreground text-sm">
            Votre file de commandes est a jour.
          </div>
        ) : (
          visibleOrders.map((order) => (
            <div className="grid gap-3 rounded-md border p-3 md:grid-cols-[minmax(0,1fr)_auto]" key={order.id}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm">{order.orderNumber}</span>
                  <Badge className={paymentStatusClassName(order.paymentStatus)} variant="outline">
                    {formatPaymentStatus(order.paymentStatus)}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-muted-foreground text-xs">
                  {order.customerName} - {order.customerPhone}
                </p>
                <p className="mt-2 font-semibold text-sm">{formatMoney(order.totalAmount, order.currency)}</p>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <Button
                  disabled={busyOrderId === order.id}
                  onClick={() => changeStatus(order, "confirmed")}
                  size="sm"
                  type="button"
                >
                  <CheckCircle2 className="size-4" />
                  Confirmer
                </Button>
                <Button
                  disabled={busyOrderId === order.id}
                  onClick={() => changeStatus(order, "cancelled")}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <XCircle className="size-4" />
                  Annuler
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
