"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { CheckCircle2, CreditCard, Loader2, ReceiptText, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CommerceOrderResponse, CommercePaymentIntentResponse } from "@/lib/commerce/commerce.types";
import { formatMoney, formatPaymentStatus, paymentStatusClassName } from "@/lib/commerce/commerce-format";

type ShopOrderPaymentPanelProps = {
  initialOrder: CommerceOrderResponse;
  slug: string;
};

export function ShopOrderPaymentPanel({ initialOrder, slug }: ShopOrderPaymentPanelProps) {
  const router = useRouter();
  const [isPreparing, setIsPreparing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [order, setOrder] = useState(initialOrder);
  const [paymentError, setPaymentError] = useState("");
  const [paymentIntent, setPaymentIntent] = useState<CommercePaymentIntentResponse | null>(null);
  const paid = order.paymentStatus === "paid" || paymentIntent?.status === "paid";

  async function preparePayment() {
    setIsPreparing(true);
    setPaymentError("");
    try {
      const response = await fetch(`/api/public/commerce/stores/${slug}/orders/${order.id}/payment-intent`, {
        body: JSON.stringify({
          metadata: {
            orderNumber: order.orderNumber,
            source: "public_order_page",
          },
          provider: "simulated",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        paymentIntent?: CommercePaymentIntentResponse;
      } | null;

      if (!response.ok || !result?.paymentIntent) {
        setPaymentError(result?.message ?? "Impossible de preparer le paiement.");
        toast.error(result?.message ?? "Impossible de preparer le paiement.");
        return;
      }

      setPaymentIntent(result.paymentIntent);
      setOrder((currentOrder) => ({ ...currentOrder, paymentStatus: "pending" }));
      toast.success("Paiement pret.");
    } finally {
      setIsPreparing(false);
    }
  }

  async function simulatePayment() {
    if (!paymentIntent) {
      await preparePayment();
      return;
    }

    setIsPaying(true);
    setPaymentError("");
    try {
      const response = await fetch(
        `/api/public/commerce/stores/${slug}/payment-intents/${paymentIntent.id}/simulate-paid`,
        {
          method: "POST",
        },
      );
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        paymentIntent?: CommercePaymentIntentResponse;
      } | null;

      if (!response.ok || !result?.paymentIntent) {
        setPaymentError(result?.message ?? "Paiement refuse. Reessayez.");
        toast.error(result?.message ?? "Paiement refuse.");
        return;
      }

      setPaymentIntent(result.paymentIntent);
      setOrder((currentOrder) => ({ ...currentOrder, paymentStatus: "paid" }));
      toast.success("Paiement confirme.");
      router.refresh();
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <div className="grid gap-4 rounded-lg border bg-background p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <CreditCard className="size-5 text-[color:var(--shop-accent)]" />
            Paiement
          </div>
          <p className="mt-1 text-muted-foreground text-sm">
            {paid ? "Votre paiement est confirme." : "Reprenez le paiement test de cette commande."}
          </p>
        </div>
        <Badge className={paymentStatusClassName(order.paymentStatus)} variant="outline">
          {formatPaymentStatus(order.paymentStatus)}
        </Badge>
      </div>

      <div className="grid gap-3 rounded-md border bg-muted/20 p-3">
        <Info label="Montant" value={formatMoney(order.totalAmount, order.currency)} />
        <Info label="Reference commande" value={order.orderNumber} />
        <Info label="Reference paiement" value={paymentIntent?.checkoutReference ?? "Non preparee"} />
      </div>

      {paymentError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">{paymentError}</p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {paid ? (
          <Button disabled type="button" variant="outline">
            <CheckCircle2 className="size-4" />
            Paiement confirme
          </Button>
        ) : paymentIntent ? (
          <Button
            className="bg-[color:var(--shop-accent)] text-white hover:bg-[color:var(--shop-accent)]/90"
            disabled={isPaying}
            onClick={simulatePayment}
            type="button"
          >
            {isPaying ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
            Simuler le paiement
          </Button>
        ) : (
          <Button
            className="bg-[color:var(--shop-accent)] text-white hover:bg-[color:var(--shop-accent)]/90"
            disabled={isPreparing}
            onClick={preparePayment}
            type="button"
          >
            {isPreparing ? <Loader2 className="size-4 animate-spin" /> : <ReceiptText className="size-4" />}
            Preparer le paiement
          </Button>
        )}
        <Button disabled={isPreparing || isPaying} onClick={() => router.refresh()} type="button" variant="outline">
          <RefreshCw className="size-4" />
          Actualiser
        </Button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-all text-right font-medium">{value}</span>
    </div>
  );
}
