"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import {
  CheckCircle2,
  Clock3,
  CreditCard,
  History,
  Loader2,
  PackageCheck,
  ReceiptText,
  Search,
  ShoppingBag,
  Store,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type {
  CommerceOrderEventResponse,
  CommerceOrderResponse,
  CommerceOrderStatus,
  CommerceStoreResponse,
} from "@/lib/commerce/commerce.types";
import {
  formatMoney,
  formatOrderStatus,
  formatPaymentStatus,
  orderStatusClassName,
  paymentStatusClassName,
} from "@/lib/commerce/commerce-format";

import { ShopOrderPaymentPanel } from "./shop-order-payment-panel";

type ShopOrderTrackingPanelProps = {
  orderNumber: string;
  slug: string;
  store: CommerceStoreResponse;
};

const ORDER_FLOW: CommerceOrderStatus[] = ["pending", "confirmed", "preparing", "ready", "fulfilled"];

export function ShopOrderTrackingPanel({ orderNumber, slug, store }: ShopOrderTrackingPanelProps) {
  const [customerPhone, setCustomerPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<CommerceOrderResponse | null>(null);
  const storageKey = `neutrino-shop-order:${slug}:${orderNumber}`;

  const lookupOrder = useCallback(
    async (phone: string, options: { silent?: boolean } = {}) => {
      const normalizedPhone = phone.trim();
      if (!normalizedPhone) {
        setError("Saisissez le telephone utilise lors de la commande.");
        return;
      }

      setError("");
      setIsLoading(true);
      try {
        const response = await fetch(`/api/public/commerce/stores/${slug}/orders/lookup`, {
          body: JSON.stringify({
            customerPhone: normalizedPhone,
            orderNumber,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });
        const result = (await response.json().catch(() => null)) as {
          message?: string;
          order?: CommerceOrderResponse;
        } | null;

        if (!response.ok || !result?.order) {
          setOrder(null);
          setError(result?.message ?? "Commande introuvable.");
          if (!options.silent) {
            toast.error(result?.message ?? "Commande introuvable.");
          }
          return;
        }

        window.sessionStorage.setItem(storageKey, normalizedPhone);
        setOrder(result.order);
        if (!options.silent) {
          toast.success("Commande trouvee.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [orderNumber, slug, storageKey],
  );

  useEffect(() => {
    const storedPhone = window.sessionStorage.getItem(storageKey);
    if (storedPhone) {
      setCustomerPhone(storedPhone);
      void lookupOrder(storedPhone, { silent: true });
    }
  }, [lookupOrder, storageKey]);

  async function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await lookupOrder(customerPhone);
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8 lg:py-12">
      <section className="grid content-start gap-6">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className="gap-1 border-[color:var(--shop-accent)]/25 text-[color:var(--shop-accent)]"
              variant="outline"
            >
              <CheckCircle2 className="size-3.5" />
              Suivi commande
            </Badge>
            <Badge variant="secondary">{store.displayName}</Badge>
          </div>
          <div>
            <p className="font-medium text-[color:var(--shop-accent)] text-sm">{orderNumber}</p>
            <h1 className="mt-2 max-w-3xl font-semibold text-4xl tracking-tight md:text-5xl">
              Suivi de votre commande
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground leading-7">
              Confirmez le telephone utilise lors de la commande pour consulter le detail et reprendre le paiement.
            </p>
          </div>
        </div>

        {order ? (
          <OrderSummary order={order} />
        ) : (
          <div className="rounded-lg border bg-background p-5 shadow-sm">
            <form className="grid gap-4" onSubmit={submitLookup}>
              <div>
                <div className="flex items-center gap-2 font-semibold">
                  <Search className="size-5 text-[color:var(--shop-accent)]" />
                  Verifier la commande
                </div>
                <p className="mt-1 text-muted-foreground text-sm">
                  Entrez le telephone laisse au moment de la commande.
                </p>
              </div>
              <Input
                autoComplete="tel"
                name="customerPhone"
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="+216..."
                required
                value={customerPhone}
              />
              {error ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">{error}</p>
              ) : null}
              <Button
                className="bg-[color:var(--shop-accent)] text-white hover:bg-[color:var(--shop-accent)]/90"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                Afficher la commande
              </Button>
            </form>
          </div>
        )}
      </section>

      <aside className="grid content-start gap-4">
        {order ? <ShopOrderPaymentPanel initialOrder={order} slug={slug} /> : null}
        <div className="rounded-lg border bg-muted/20 p-5">
          <div className="flex items-center gap-2 font-medium">
            <Store className="size-4 text-[color:var(--shop-accent)]" />
            {store.businessName}
          </div>
          <p className="mt-2 text-muted-foreground text-sm">
            Le marchand verra la commande dans son espace des que le paiement est confirme.
          </p>
          <Button asChild className="mt-4" size="sm" variant="outline">
            <Link href={`/shop/${slug}`}>Retour boutique</Link>
          </Button>
        </div>
      </aside>
    </div>
  );
}

function OrderSummary({ order }: { order: CommerceOrderResponse }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatusCard
          className={orderStatusClassName(order.status)}
          icon={ReceiptText}
          label="Commande"
          value={formatOrderStatus(order.status)}
        />
        <StatusCard
          className={paymentStatusClassName(order.paymentStatus)}
          icon={ShoppingBag}
          label="Paiement"
          value={formatPaymentStatus(order.paymentStatus)}
        />
        <StatusCard icon={Clock3} label="Date" value={formatDate(order.createdAt)} />
      </div>

      <PublicOrderProgress order={order} />

      <div className="rounded-lg border bg-background p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <PackageCheck className="size-5 text-[color:var(--shop-accent)]" />
          Produits commandes
        </div>
        <div className="grid gap-3">
          {order.items.map((item) => (
            <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_auto]" key={item.id}>
              <div>
                <div className="font-medium text-sm">{item.productName}</div>
                <div className="text-muted-foreground text-xs">SKU {item.productSku ?? "-"}</div>
              </div>
              <div className="text-sm sm:text-right">
                <div>
                  {item.quantity} x {formatMoney(item.unitPriceAmount, item.currency)}
                </div>
                <div className="font-semibold">{formatMoney(item.lineTotalAmount, item.currency)}</div>
              </div>
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="flex items-center justify-between gap-3 font-semibold">
          <span>Total</span>
          <span>{formatMoney(order.totalAmount, order.currency)}</span>
        </div>
      </div>

      <PublicOrderTimeline events={order.events} />
    </>
  );
}

function PublicOrderProgress({ order }: { order: CommerceOrderResponse }) {
  const cancelled = order.status === "cancelled";
  const currentIndex = ORDER_FLOW.indexOf(order.status);

  return (
    <div className="rounded-lg border bg-background p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            {cancelled ? (
              <XCircle className="size-5 text-rose-600" />
            ) : (
              <PackageCheck className="size-5 text-[color:var(--shop-accent)]" />
            )}
            Etat de livraison
          </div>
          <p className="mt-1 text-muted-foreground text-sm">
            {cancelled
              ? "Cette commande a ete annulee. Contactez la boutique si vous avez une question."
              : progressHelpText(order.status)}
          </p>
        </div>
        <Badge className={orderStatusClassName(order.status)} variant="outline">
          {formatOrderStatus(order.status)}
        </Badge>
      </div>

      {cancelled ? null : (
        <div className="mt-5 grid gap-3 sm:grid-cols-5">
          {ORDER_FLOW.map((status, index) => {
            const done = currentIndex >= index;
            const current = order.status === status;

            return (
              <div className="grid gap-2" key={status}>
                <div
                  className={done ? "h-1.5 rounded-full bg-[color:var(--shop-accent)]" : "h-1.5 rounded-full bg-muted"}
                />
                <div
                  className={
                    current ? "font-semibold text-sm" : done ? "font-medium text-sm" : "text-muted-foreground text-sm"
                  }
                >
                  {formatOrderStatus(status)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PublicOrderTimeline({ events }: { events: CommerceOrderEventResponse[] }) {
  const visibleEvents = events.filter((event) => PUBLIC_EVENT_LABELS[event.eventType]);

  return (
    <div className="rounded-lg border bg-background p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 font-semibold">
        <History className="size-5 text-[color:var(--shop-accent)]" />
        Historique commande
      </div>

      {visibleEvents.length === 0 ? (
        <div className="rounded-md border border-dashed p-5 text-muted-foreground text-sm">
          L'historique sera mis a jour quand la boutique traite la commande.
        </div>
      ) : (
        <div className="grid gap-3">
          {visibleEvents.map((event, index) => (
            <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-3" key={event.id}>
              <div className="flex flex-col items-center">
                <span className="mt-1 flex size-7 items-center justify-center rounded-full border bg-background">
                  {event.eventType.includes("payment") || event.eventType === "order_paid" ? (
                    <CreditCard className="size-3.5 text-[color:var(--shop-accent)]" />
                  ) : (
                    <Clock3 className="size-3.5 text-[color:var(--shop-accent)]" />
                  )}
                </span>
                {index < visibleEvents.length - 1 ? <span className="mt-2 min-h-8 w-px flex-1 bg-border" /> : null}
              </div>
              <div className="rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={orderStatusClassName(event.status)} variant="outline">
                    {formatOrderStatus(event.status)}
                  </Badge>
                  <span className="font-medium text-sm">{PUBLIC_EVENT_LABELS[event.eventType]}</span>
                </div>
                <p className="mt-1 text-muted-foreground text-xs">{formatDate(event.createdAt)}</p>
                {event.message ? <p className="mt-2 text-sm">{event.message}</p> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusCard({
  className,
  icon: Icon,
  label,
  value,
}: {
  className?: string;
  icon: typeof ReceiptText;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <Icon className="mb-3 size-5 text-[color:var(--shop-accent)]" />
      <div className="text-muted-foreground text-xs">{label}</div>
      <Badge className={`mt-2 ${className ?? "border-muted bg-muted/30 text-muted-foreground"}`} variant="outline">
        {value}
      </Badge>
    </div>
  );
}

const PUBLIC_EVENT_LABELS: Record<string, string> = {
  order_cancelled: "Commande annulee",
  order_confirmed: "Commande confirmee",
  order_created: "Commande recue",
  order_fulfilled: "Commande livree",
  order_paid: "Paiement confirme",
  order_payment_failed: "Paiement en echec",
  order_payment_pending: "Paiement en cours",
  order_preparing: "Preparation demarree",
  order_ready: "Commande prete",
  order_refunded: "Paiement rembourse",
};

function progressHelpText(status: CommerceOrderStatus) {
  const labels: Record<CommerceOrderStatus, string> = {
    cancelled: "Cette commande a ete annulee.",
    confirmed: "La boutique a confirme votre commande.",
    draft: "La commande est en brouillon.",
    fulfilled: "La commande est terminee.",
    pending: "La boutique doit encore confirmer votre commande.",
    preparing: "La boutique prepare votre commande.",
    ready: "Votre commande est prete pour la suite.",
  };

  return labels[status] ?? "La boutique mettra le suivi a jour.";
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
