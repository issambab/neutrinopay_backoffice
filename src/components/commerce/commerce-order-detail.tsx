"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Ban,
  CheckCircle2,
  Clock3,
  CreditCard,
  History,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type {
  CommerceOrderResponse,
  CommerceOrderStatus,
  CommercePaymentIntentResponse,
  CommercePaymentIntentStatus,
  CommercePaymentStatus,
} from "@/lib/commerce/commerce.types";
import {
  formatMoney,
  formatOrderStatus,
  formatOrderPaymentMethod,
  formatPaymentIntentStatus,
  formatPaymentStatus,
  orderStatusClassName,
  paymentIntentStatusClassName,
  paymentStatusClassName,
} from "@/lib/commerce/commerce-format";

type CommerceOrderDetailProps = {
  allowPaymentIntentManagement?: boolean;
  isBusy?: boolean;
  onPaymentStatusChange?: (form: HTMLFormElement, order: CommerceOrderResponse, status: CommercePaymentStatus) => void;
  onStatusChange?: (form: HTMLFormElement, order: CommerceOrderResponse, status: CommerceOrderStatus) => void;
  order: CommerceOrderResponse;
  paymentIntentScope?: "admin" | "merchant";
  readonly?: boolean;
  showMerchantInfo?: boolean;
  variant?: "panel" | "dialog";
};

const ORDER_FLOW: CommerceOrderStatus[] = ["pending", "confirmed", "preparing", "ready", "fulfilled"];
const PAYMENT_FLOW: CommercePaymentStatus[] = ["unpaid", "pending", "paid"];

export function CommerceOrderDetail({
  allowPaymentIntentManagement = false,
  isBusy = false,
  onPaymentStatusChange,
  onStatusChange,
  order,
  paymentIntentScope,
  readonly = false,
  showMerchantInfo = false,
  variant = "panel",
}: CommerceOrderDetailProps) {
  const router = useRouter();
  const [intentError, setIntentError] = useState("");
  const [intentsLoading, setIntentsLoading] = useState(false);
  const [paymentIntents, setPaymentIntents] = useState<CommercePaymentIntentResponse[]>([]);
  const [updatingIntentId, setUpdatingIntentId] = useState("");
  const orderTransitions = readonly ? [] : allowedOrderTransitions(order.status);
  const paymentTransitions = readonly || !onPaymentStatusChange ? [] : allowedPaymentTransitions(order.paymentStatus);
  const canManagePaymentIntents = allowPaymentIntentManagement && paymentIntentScope === "admin";
  const posPaymentFacts = resolvePosPaymentFacts(order);

  useEffect(() => {
    if (!paymentIntentScope) {
      setPaymentIntents([]);
      setIntentError("");
      return;
    }

    let cancelled = false;
    const scope = paymentIntentScope;

    async function loadPaymentIntents() {
      setIntentsLoading(true);
      setIntentError("");
      try {
        const response = await fetch(paymentIntentListUrl(scope, order.id), {
          cache: "no-store",
        });
        const result = (await response.json().catch(() => null)) as {
          message?: string;
          paymentIntents?: CommercePaymentIntentResponse[];
        } | null;

        if (!response.ok || !result?.paymentIntents) {
          throw new Error(result?.message ?? "Impossible de charger les transactions paiement.");
        }

        if (!cancelled) {
          setPaymentIntents(result.paymentIntents);
        }
      } catch (error) {
        if (!cancelled) {
          setPaymentIntents([]);
          setIntentError(error instanceof Error ? error.message : "Impossible de charger les transactions paiement.");
        }
      } finally {
        if (!cancelled) {
          setIntentsLoading(false);
        }
      }
    }

    void loadPaymentIntents();

    return () => {
      cancelled = true;
    };
  }, [order.id, paymentIntentScope]);

  async function changePaymentIntentStatus(
    form: HTMLFormElement,
    paymentIntent: CommercePaymentIntentResponse,
    status: CommercePaymentIntentStatus,
  ) {
    if (!canManagePaymentIntents) {
      return;
    }

    const formData = new FormData(form);
    setUpdatingIntentId(paymentIntent.id);
    try {
      const response = await fetch(`/api/commerce/admin/payment-intents/${paymentIntent.id}/status`, {
        body: JSON.stringify({
          message: textValue(formData, "intentMessage"),
          metadata: {
            checkoutReference: paymentIntent.checkoutReference,
            orderId: order.id,
            source: "admin_order_detail",
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
        paymentIntent?: CommercePaymentIntentResponse;
      } | null;

      if (!response.ok || !result?.paymentIntent) {
        toast.error(result?.message ?? "Impossible de modifier le paiement.");
        return;
      }

      setPaymentIntents((items) =>
        items.map((item) => (item.id === result.paymentIntent?.id ? result.paymentIntent : item)),
      );
      toast.success("Transaction paiement mise a jour.");
      form.reset();
      router.refresh();
    } finally {
      setUpdatingIntentId("");
    }
  }

  return (
    <div className={variant === "dialog" ? "grid gap-4" : "grid content-start gap-4"}>
      <Card>
        <CardHeader className="gap-3 border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="truncate">{order.orderNumber}</CardTitle>
                <Badge className={orderStatusClassName(order.status)} variant="outline">
                  {formatOrderStatus(order.status)}
                </Badge>
                <Badge className={paymentStatusClassName(order.paymentStatus)} variant="outline">
                  {formatPaymentStatus(order.paymentStatus)}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground text-sm">
                Creee le {formatDate(order.createdAt)} - {order.items.length} ligne(s)
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="text-muted-foreground text-xs">Total commande</div>
              <div className="font-semibold text-2xl">{formatMoney(order.totalAmount, order.currency)}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <StatusRail
              cancelled={order.status === "cancelled"}
              current={order.status}
              items={ORDER_FLOW}
              label="Cycle commande"
              statusClassName={orderStatusClassName}
              statusLabel={formatOrderStatus}
              terminalLabel="Annulee"
            />
            <StatusRail
              cancelled={order.paymentStatus === "failed" || order.paymentStatus === "refunded"}
              current={order.paymentStatus}
              items={PAYMENT_FLOW}
              label="Cycle paiement"
              statusClassName={paymentStatusClassName}
              statusLabel={formatPaymentStatus}
              terminalLabel={order.paymentStatus === "refunded" ? "Remboursee" : "Echec"}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {showMerchantInfo ? (
              <>
                <Info icon={ShoppingBag} label="Marchand" value={order.businessName} />
                <Info icon={ReceiptText} label="Boutique" value={order.storeDisplayName} />
              </>
            ) : null}
            <Info icon={User} label="Client" value={order.customerName} />
            <Info icon={Phone} label="Telephone" value={order.customerPhone} />
            <Info icon={Mail} label="Email" value={order.customerEmail ?? "-"} />
            <Info icon={CreditCard} label="Paiement" value={formatPaymentStatus(order.paymentStatus)} />
            <Info icon={CreditCard} label="Mode paiement" value={formatOrderPaymentMethod(order.metadata)} />
            <Info icon={MapPin} label="Adresse" value={order.customerAddressLine1 ?? "-"} />
            <Info icon={MapPin} label="Ville" value={order.customerCity ?? "-"} />
            <Info icon={ReceiptText} label="Note" value={order.notes ?? "-"} />
          </div>

          {posPaymentFacts.length ? (
            <div className="mt-4 grid gap-3 rounded-md border bg-muted/10 p-3 md:grid-cols-2 xl:grid-cols-3">
              {posPaymentFacts.map((fact) => (
                <Info icon={CreditCard} key={fact.label} label={fact.label} value={fact.value} />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            Produits commandes
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {order.items.map((item) => (
            <div className="grid gap-2 rounded-md border p-3 md:grid-cols-[minmax(0,1fr)_auto]" key={item.id}>
              <div className="min-w-0">
                <div className="font-medium text-sm">{item.productName}</div>
                <div className="text-muted-foreground text-xs">SKU {item.productSku ?? "-"}</div>
              </div>
              <div className="text-sm md:text-right">
                <div>
                  {item.quantity} x {formatMoney(item.unitPriceAmount, item.currency)}
                </div>
                <div className="font-semibold">{formatMoney(item.lineTotalAmount, item.currency)}</div>
              </div>
            </div>
          ))}
          <Separator className="my-1" />
          <div className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 font-medium text-sm">
            <span>Sous-total</span>
            <span>{formatMoney(order.subtotalAmount, order.currency)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 font-semibold text-sm">
            <span>Total</span>
            <span>{formatMoney(order.totalAmount, order.currency)}</span>
          </div>
        </CardContent>
      </Card>

      {paymentIntentScope ? (
        <PaymentIntentsCard
          canManage={canManagePaymentIntents}
          error={intentError}
          isLoading={intentsLoading}
          onStatusChange={changePaymentIntentStatus}
          paymentIntents={paymentIntents}
          updatingIntentId={updatingIntentId}
        />
      ) : null}

      {!readonly && onStatusChange ? (
        <OrderActions
          isBusy={isBusy}
          label="Actions commande"
          messageName="message"
          onChange={(form, status) => onStatusChange(form, order, status)}
          placeholder="Message optionnel pour l'historique commande"
          transitions={orderTransitions}
        />
      ) : null}

      {!readonly && onPaymentStatusChange ? (
        <OrderActions
          isBusy={isBusy}
          label="Actions paiement"
          messageName="paymentMessage"
          onChange={(form, status) => onPaymentStatusChange(form, order, status)}
          placeholder="Message optionnel pour l'historique paiement"
          transitions={paymentTransitions}
        />
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <History className="size-5" />
            Historique
          </CardTitle>
        </CardHeader>
        <CardContent>
          {order.events.length === 0 ? (
            <EmptyPanel text="Aucun evenement." />
          ) : (
            <div className="grid gap-3">
              {order.events.map((event, index) => (
                <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-3" key={event.id}>
                  <div className="flex flex-col items-center">
                    <span className="mt-1 flex size-6 items-center justify-center rounded-full border bg-background">
                      <Clock3 className="size-3 text-muted-foreground" />
                    </span>
                    {index < order.events.length - 1 ? <span className="mt-2 min-h-8 w-px flex-1 bg-border" /> : null}
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={orderStatusClassName(event.status)} variant="outline">
                        {formatOrderStatus(event.status)}
                      </Badge>
                      <span className="font-medium text-sm">{formatOrderEventType(event.eventType)}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground text-xs">{formatDate(event.createdAt)}</p>
                    {event.message ? <p className="mt-2 text-sm">{event.message}</p> : null}
                    {event.metadata && Object.keys(event.metadata).length > 0 ? (
                      <div className="mt-2 rounded-md bg-muted/40 p-2 text-muted-foreground text-xs">
                        {Object.entries(event.metadata)
                          .map(([key, value]) => `${key}: ${String(value)}`)
                          .join(" - ")}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentIntentsCard({
  canManage,
  error,
  isLoading,
  onStatusChange,
  paymentIntents,
  updatingIntentId,
}: {
  canManage: boolean;
  error: string;
  isLoading: boolean;
  onStatusChange: (
    form: HTMLFormElement,
    paymentIntent: CommercePaymentIntentResponse,
    status: CommercePaymentIntentStatus,
  ) => void;
  paymentIntents: CommercePaymentIntentResponse[];
  updatingIntentId: string;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="size-5" />
          Transactions paiement
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed p-6 text-muted-foreground text-sm">
            <RefreshCw className="size-4 animate-spin" />
            Chargement des paiements.
          </div>
        ) : error ? (
          <EmptyPanel text={error} />
        ) : paymentIntents.length === 0 ? (
          <EmptyPanel text="Aucune transaction paiement pour cette commande." />
        ) : (
          <div className="grid gap-3">
            {paymentIntents.map((paymentIntent) => (
              <PaymentIntentItem
                canManage={canManage}
                isBusy={updatingIntentId === paymentIntent.id}
                key={paymentIntent.id}
                onStatusChange={onStatusChange}
                paymentIntent={paymentIntent}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentIntentItem({
  canManage,
  isBusy,
  onStatusChange,
  paymentIntent,
}: {
  canManage: boolean;
  isBusy: boolean;
  onStatusChange: (
    form: HTMLFormElement,
    paymentIntent: CommercePaymentIntentResponse,
    status: CommercePaymentIntentStatus,
  ) => void;
  paymentIntent: CommercePaymentIntentResponse;
}) {
  const transitions = allowedPaymentIntentTransitions(paymentIntent.status);

  return (
    <div className="grid gap-3 rounded-md border p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={paymentIntentStatusClassName(paymentIntent.status)} variant="outline">
              {formatPaymentIntentStatus(paymentIntent.status)}
            </Badge>
            <span className="break-all font-medium text-sm">{paymentIntent.checkoutReference}</span>
          </div>
          <p className="mt-1 text-muted-foreground text-xs">
            {paymentIntent.provider} {paymentIntent.providerReference ? `- ${paymentIntent.providerReference}` : ""}
          </p>
        </div>
        <div className="text-sm md:text-right">
          <div className="font-semibold">{formatMoney(paymentIntent.amount, paymentIntent.currency)}</div>
          <div className="text-muted-foreground text-xs">Cree le {formatDate(paymentIntent.createdAt)}</div>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <Info icon={Clock3} label="Expiration" value={formatDate(paymentIntent.expiresAt)} />
        <Info icon={CheckCircle2} label="Confirmation" value={formatDate(paymentIntent.confirmedAt)} />
        <Info icon={XCircle} label="Erreur" value={paymentIntent.failureReason ?? "-"} />
      </div>

      {canManage && transitions.length > 0 ? (
        <form className="grid gap-2 border-t pt-3" onSubmit={(event) => event.preventDefault()}>
          <Textarea name="intentMessage" placeholder="Raison ou note paiement" rows={2} />
          <div className="flex flex-wrap gap-2">
            <NativeSelect
              className="w-full sm:w-48"
              defaultValue=""
              disabled={isBusy}
              name="intentStatus"
              onChange={(event) => {
                const value = event.target.value as CommercePaymentIntentStatus | "";
                const form = event.currentTarget.form;
                if (value && form) {
                  onStatusChange(form, paymentIntent, value);
                  event.currentTarget.value = "";
                }
              }}
            >
              <NativeSelectOption value="">Changer statut</NativeSelectOption>
              {transitions.map((status) => (
                <NativeSelectOption key={status} value={status}>
                  {formatPaymentIntentStatus(status)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function StatusRail<T extends string>({
  cancelled,
  current,
  items,
  label,
  statusClassName,
  statusLabel,
  terminalLabel,
}: {
  cancelled: boolean;
  current: T;
  items: T[];
  label: string;
  statusClassName: (status: T) => string;
  statusLabel: (status: T) => string;
  terminalLabel: string;
}) {
  const currentIndex = items.indexOf(current);

  return (
    <div className="rounded-md border p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="font-medium text-sm">{label}</div>
        <Badge className={statusClassName(current)} variant="outline">
          {cancelled ? terminalLabel : statusLabel(current)}
        </Badge>
      </div>
      {cancelled ? (
        <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-muted-foreground text-sm">
          <XCircle className="size-4" />
          Cycle termine hors parcours standard.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {items.map((item, index) => {
            const isDone = currentIndex >= index;
            return (
              <div className="grid gap-1" key={item}>
                <div className={isDone ? "h-1 rounded-full bg-primary" : "h-1 rounded-full bg-muted"} />
                <div className={isDone ? "font-medium text-xs" : "text-muted-foreground text-xs"}>
                  {statusLabel(item)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-1 break-words font-medium text-sm">{value}</div>
    </div>
  );
}

function resolvePosPaymentFacts(order: CommerceOrderResponse) {
  const metadata = order.metadata ?? {};
  const source = metadataText(metadata, "source");
  if (source !== "pos" && source !== "pos_refund") {
    return [];
  }

  const currency = order.currency || "TND";
  const facts = [
    { label: "Type paiement", value: formatOrderPaymentMethod(metadata) },
    { label: "Terminal", value: metadataText(metadata, "terminalCode") },
    { label: "Reference POS", value: metadataText(metadata, "paymentReference") },
    { label: "Cash recu", value: formatMinorMoney(metadataNumber(metadata, "cashReceivedAmountMinor"), currency) },
    {
      label: metadataText(metadata, "changeReturnMethod") === "wallet" ? "Rendu wallet" : "Rendu especes",
      value: formatMinorMoney(metadataNumber(metadata, "changeAmountMinor"), currency),
    },
    { label: "Client rendu", value: metadataText(metadata, "changeRecipientName") },
    { label: "Reference ledger", value: metadataText(metadata, "changeLedgerReference") ?? metadataText(metadata, "ledgerReference") },
    {
      label: "Transaction ledger",
      value: metadataText(metadata, "changeLedgerTransactionId") ?? metadataText(metadata, "ledgerTransactionId"),
    },
    { label: "Reference refund", value: metadataText(metadata, "refundLedgerReference") },
    { label: "Transaction refund", value: metadataText(metadata, "refundLedgerTransactionId") },
  ];

  return facts.filter((fact): fact is { label: string; value: string } => Boolean(fact.value));
}

function OrderActions<T extends CommerceOrderStatus | CommercePaymentStatus>({
  isBusy,
  label,
  messageName,
  onChange,
  placeholder,
  transitions,
}: {
  isBusy: boolean;
  label: string;
  messageName: string;
  onChange: (form: HTMLFormElement, status: T) => void;
  placeholder: string;
  transitions: { icon: typeof CheckCircle2; label: string; status: T }[];
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {transitions.length === 0 ? (
          <EmptyPanel text="Aucune action disponible pour ce statut." />
        ) : (
          <form className="grid gap-3" onSubmit={(event) => event.preventDefault()}>
            <Textarea name={messageName} placeholder={placeholder} rows={3} />
            <div className="flex flex-wrap gap-2">
              {transitions.map((transition) => (
                <Button
                  disabled={isBusy}
                  key={transition.status}
                  onClick={(event) => {
                    const form = event.currentTarget.form;
                    if (form) {
                      onChange(form, transition.status);
                    }
                  }}
                  type="button"
                  variant={transition.status === "cancelled" || transition.status === "failed" ? "outline" : "default"}
                >
                  <transition.icon className="size-4" />
                  {transition.label}
                </Button>
              ))}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function allowedOrderTransitions(status: CommerceOrderStatus) {
  if (status === "pending") {
    return [
      { icon: CheckCircle2, label: "Confirmer", status: "confirmed" as const },
      { icon: XCircle, label: "Annuler", status: "cancelled" as const },
    ];
  }

  if (status === "confirmed") {
    return [
      { icon: PackageCheck, label: "Preparation", status: "preparing" as const },
      { icon: XCircle, label: "Annuler", status: "cancelled" as const },
    ];
  }

  if (status === "preparing") {
    return [
      { icon: CheckCircle2, label: "Prete", status: "ready" as const },
      { icon: XCircle, label: "Annuler", status: "cancelled" as const },
    ];
  }

  if (status === "ready") {
    return [
      { icon: PackageCheck, label: "Marquer livree", status: "fulfilled" as const },
      { icon: XCircle, label: "Annuler", status: "cancelled" as const },
    ];
  }

  return [];
}

function allowedPaymentTransitions(status: CommercePaymentStatus) {
  if (status === "unpaid") {
    return [
      { icon: ReceiptText, label: "En cours", status: "pending" as const },
      { icon: CheckCircle2, label: "Marquer paye", status: "paid" as const },
      { icon: XCircle, label: "Echec paiement", status: "failed" as const },
    ];
  }

  if (status === "pending" || status === "failed") {
    return [
      { icon: CheckCircle2, label: "Marquer paye", status: "paid" as const },
      { icon: XCircle, label: "Echec paiement", status: "failed" as const },
    ].filter((transition) => transition.status !== status);
  }

  if (status === "paid") {
    return [{ icon: Ban, label: "Rembourser", status: "refunded" as const }];
  }

  return [];
}

function allowedPaymentIntentTransitions(status: CommercePaymentIntentStatus) {
  if (status === "created" || status === "pending" || status === "failed") {
    return ["paid", "failed", "cancelled"] as CommercePaymentIntentStatus[];
  }

  if (status === "paid") {
    return ["refunded"] as CommercePaymentIntentStatus[];
  }

  return [];
}

function formatOrderEventType(value: string) {
  const labels: Record<string, string> = {
    order_cancelled: "Commande annulee",
    order_confirmed: "Commande confirmee",
    order_created: "Commande creee",
    order_fulfilled: "Commande livree",
    order_preparing: "Preparation demarree",
    order_ready: "Commande prete",
    order_paid: "Paiement confirme",
    order_payment_cancelled: "Paiement annule",
    order_payment_failed: "Paiement en echec",
    order_payment_pending: "Paiement en cours",
    order_payment_unpaid: "Paiement non paye",
    order_refunded: "Commande remboursee",
  };

  return labels[value] ?? value;
}

function paymentIntentListUrl(scope: "admin" | "merchant", orderId: string) {
  if (scope === "admin") {
    return `/api/commerce/admin/orders/${orderId}/payment-intents`;
  }

  return `/api/merchant/commerce/orders/${orderId}/payment-intents`;
}

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function EmptyPanel({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">{text}</div>;
}

function metadataText(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function metadataNumber(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatMinorMoney(amountMinor: number | null, currency: string) {
  if (amountMinor == null || amountMinor <= 0) {
    return null;
  }

  return formatMoney(amountMinor / 100, currency);
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
