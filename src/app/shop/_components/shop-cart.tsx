"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CheckCircle2, CreditCard, Loader2, Minus, Plus, ReceiptText, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type {
  CommerceOrderResponse,
  CommercePaymentIntentResponse,
  CreateCommerceOrderRequest,
  ProductResponse,
} from "@/lib/commerce/commerce.types";
import { formatMoney } from "@/lib/commerce/commerce-format";
import { cn } from "@/lib/utils";

import { primaryImage, publicProductImageUrl } from "./shop-product-media";

type CartItem = {
  currency: string;
  imageId?: string | null;
  name: string;
  priceAmount: number;
  productId: string;
  productSlug: string;
  quantity: number;
  stockQuantity: number;
};

type AddToCartEvent = CustomEvent<{ product: ProductResponse; quantity?: number }>;

type ShopCartProps = {
  slug: string;
};

export function ShopCart({ slug }: ShopCartProps) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<CommerceOrderResponse | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const [paymentIntent, setPaymentIntent] = useState<CommercePaymentIntentResponse | null>(null);
  const storageKey = `neutrino-shop-cart:${slug}`;
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const currency = items[0]?.currency ?? "TND";
  const total = items.reduce((sum, item) => sum + item.priceAmount * item.quantity, 0);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(storageKey);
    if (!storedValue) {
      return;
    }

    try {
      const parsedItems = JSON.parse(storedValue) as CartItem[];
      setItems(Array.isArray(parsedItems) ? parsedItems : []);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  useEffect(() => {
    function handleAddToCart(event: Event) {
      const { product, quantity = 1 } = (event as AddToCartEvent).detail;
      setItems((currentItems) => addItem(currentItems, product, quantity));
      setConfirmedOrder(null);
      setPaymentError("");
      setPaymentIntent(null);
      setIsOpen(true);
      toast.success("Produit ajoute au panier.");
    }

    window.addEventListener("shop:add-to-cart", handleAddToCart);
    return () => window.removeEventListener("shop:add-to-cart", handleAddToCart);
  }, []);

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0) {
      toast.error("Votre panier est vide.");
      return;
    }

    setIsSubmitting(true);
    setPaymentError("");
    setPaymentIntent(null);
    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const payload: CreateCommerceOrderRequest = {
        customerAddressLine1: textValue(formData, "customerAddressLine1"),
        customerCity: textValue(formData, "customerCity"),
        customerEmail: textValue(formData, "customerEmail"),
        customerName: textValue(formData, "customerName"),
        customerPhone: textValue(formData, "customerPhone"),
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        metadata: {
          source: "public_storefront",
        },
        notes: textValue(formData, "notes"),
      };
      const response = await fetch(`/api/public/commerce/stores/${slug}/orders`, {
        body: JSON.stringify(payload),
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
        toast.error(result?.message ?? "Impossible de creer la commande.");
        return;
      }

      const paymentResponse = await fetch(
        `/api/public/commerce/stores/${slug}/orders/${result.order.id}/payment-intent`,
        {
          body: JSON.stringify({
            metadata: {
              channel: "web",
              source: "public_storefront",
            },
            provider: "simulated",
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        },
      );
      const paymentResult = (await paymentResponse.json().catch(() => null)) as {
        message?: string;
        paymentIntent?: CommercePaymentIntentResponse;
      } | null;

      setConfirmedOrder(result.order);
      rememberOrderPhone(slug, result.order.orderNumber, payload.customerPhone);
      setItems([]);
      form.reset();

      if (!paymentResponse.ok || !paymentResult?.paymentIntent) {
        setPaymentError(paymentResult?.message ?? "Commande creee, mais le paiement n'a pas pu etre prepare.");
        toast.warning("Commande creee. Paiement a reprendre.");
        router.push(`/shop/${slug}/orders/${encodeURIComponent(result.order.orderNumber)}`);
        return;
      }

      setPaymentIntent(paymentResult.paymentIntent);
      toast.success("Commande creee. Paiement pret.");
      router.push(`/shop/${slug}/orders/${encodeURIComponent(result.order.orderNumber)}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function simulatePayment() {
    if (!paymentIntent) {
      toast.error("Reference de paiement manquante.");
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
      setConfirmedOrder((order) => (order ? { ...order, paymentStatus: "paid" } : order));
      toast.success("Paiement confirme.");
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <>
      <Button
        className="fixed right-4 bottom-4 z-40 h-12 rounded-full bg-[color:var(--shop-accent)] px-5 text-white shadow-lg hover:bg-[color:var(--shop-accent)]/90 md:right-6 md:bottom-6"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <ShoppingBag className="size-4" />
        Panier
        {itemCount > 0 ? <Badge variant="secondary">{itemCount}</Badge> : null}
      </Button>

      <Sheet onOpenChange={setIsOpen} open={isOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Panier</SheetTitle>
            <SheetDescription>Verifiez vos produits puis laissez vos coordonnees.</SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 px-4">
            {confirmedOrder ? (
              <OrderConfirmation
                isPaying={isPaying}
                onPay={simulatePayment}
                order={confirmedOrder}
                paymentError={paymentError}
                paymentIntent={paymentIntent}
                slug={slug}
              />
            ) : null}

            {items.length === 0 && !confirmedOrder ? (
              <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">
                Votre panier est vide.
              </div>
            ) : null}

            {items.length > 0 ? (
              <>
                <div className="grid gap-3">
                  {items.map((item) => (
                    <CartLine
                      item={item}
                      key={item.productId}
                      onQuantityChange={(quantity) =>
                        setItems((currentItems) => updateQuantity(currentItems, item.productId, quantity))
                      }
                      onRemove={() =>
                        setItems((currentItems) =>
                          currentItems.filter((currentItem) => currentItem.productId !== item.productId),
                        )
                      }
                      slug={slug}
                    />
                  ))}
                </div>
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(total, currency)}</span>
                </div>
                <form className="grid gap-3" onSubmit={checkout}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input name="customerName" placeholder="Nom complet" required />
                    <Input name="customerPhone" placeholder="Telephone" required />
                  </div>
                  <Input name="customerEmail" placeholder="Email optionnel" type="email" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input name="customerAddressLine1" placeholder="Adresse" />
                    <Input name="customerCity" placeholder="Ville" />
                  </div>
                  <Textarea name="notes" placeholder="Note pour le marchand" rows={3} />
                  <SheetFooter className="px-0">
                    <Button disabled={isSubmitting} type="submit">
                      <CheckCircle2 className="size-4" />
                      Confirmer la commande
                    </Button>
                  </SheetFooter>
                </form>
              </>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function AddToCartButton({
  className,
  product,
  quantity = 1,
}: {
  className?: string;
  product: ProductResponse;
  quantity?: number;
}) {
  const disabled = product.stockQuantity <= 0;

  return (
    <Button
      className={cn(
        !disabled && "bg-[color:var(--shop-accent)] text-white hover:bg-[color:var(--shop-accent)]/90",
        className,
      )}
      disabled={disabled}
      onClick={() => addProductToCart(product, quantity)}
      type="button"
      variant={disabled ? "outline" : "default"}
    >
      <ShoppingBag className="size-4" />
      {disabled ? "Rupture" : "Ajouter au panier"}
    </Button>
  );
}

function CartLine({
  item,
  onQuantityChange,
  onRemove,
  slug,
}: {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  slug: string;
}) {
  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-md border p-2">
      <Link
        className="relative aspect-square overflow-hidden rounded-md bg-muted"
        href={`/shop/${slug}/products/${item.productSlug}`}
      >
        {item.imageId ? (
          <Image
            alt={item.name}
            className="object-cover"
            fill
            sizes="64px"
            src={publicProductImageUrl(item.imageId)}
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground text-xs">Image</div>
        )}
      </Link>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              className="line-clamp-1 font-medium text-sm hover:underline"
              href={`/shop/${slug}/products/${item.productSlug}`}
            >
              {item.name}
            </Link>
            <p className="text-muted-foreground text-xs">{formatMoney(item.priceAmount, item.currency)}</p>
          </div>
          <Button onClick={onRemove} size="icon-sm" type="button" variant="ghost">
            <Trash2 className="size-4" />
            <span className="sr-only">Supprimer</span>
          </Button>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center rounded-md border">
            <Button
              disabled={item.quantity <= 1}
              onClick={() => onQuantityChange(item.quantity - 1)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Minus className="size-4" />
              <span className="sr-only">Diminuer</span>
            </Button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <Button
              disabled={item.quantity >= item.stockQuantity}
              onClick={() => onQuantityChange(item.quantity + 1)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Plus className="size-4" />
              <span className="sr-only">Augmenter</span>
            </Button>
          </div>
          <span className="font-medium text-sm">{formatMoney(item.priceAmount * item.quantity, item.currency)}</span>
        </div>
      </div>
    </div>
  );
}

function OrderConfirmation({
  isPaying,
  onPay,
  order,
  paymentError,
  paymentIntent,
  slug,
}: {
  isPaying: boolean;
  onPay: () => void;
  order: CommerceOrderResponse;
  paymentError: string;
  paymentIntent: CommercePaymentIntentResponse | null;
  slug: string;
}) {
  const paid = paymentIntent?.status === "paid" || order.paymentStatus === "paid";

  return (
    <div className="grid gap-4 rounded-md border bg-muted/30 p-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-4 text-emerald-600" />
            Commande envoyee
          </div>
          <Badge className={paid ? "bg-emerald-600 text-white" : ""} variant={paid ? "default" : "secondary"}>
            {paid ? "Payee" : "Paiement en attente"}
          </Badge>
        </div>
        <p className="mt-2 text-muted-foreground text-sm">
          Commande <span className="font-medium text-foreground">{order.orderNumber}</span>.
          {paid ? " Le paiement est confirme." : " Finalisez le paiement test pour confirmer la vente."}
        </p>
      </div>

      <div className="rounded-md border bg-background p-3">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <ReceiptText className="size-3.5 text-[color:var(--shop-accent)]" />
          Reference paiement
        </div>
        <div className="mt-1 break-all font-semibold text-sm">
          {paymentIntent?.checkoutReference ?? "Preparation du paiement indisponible"}
        </div>
        <div className="mt-2 text-muted-foreground text-sm">
          Total: {formatMoney(paymentIntent?.amount ?? order.totalAmount, paymentIntent?.currency ?? order.currency)}
        </div>
      </div>

      {paymentError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">{paymentError}</p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {!paid ? (
          <Button
            className="bg-[color:var(--shop-accent)] text-white hover:bg-[color:var(--shop-accent)]/90"
            disabled={isPaying || !paymentIntent}
            onClick={onPay}
            type="button"
          >
            {isPaying ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
            Simuler le paiement
          </Button>
        ) : null}
        <Button asChild size="sm" variant="outline">
          <Link href={`/shop/${slug}/orders/${encodeURIComponent(order.orderNumber)}`}>Voir le suivi</Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href={`/shop/${slug}`}>Continuer mes achats</Link>
        </Button>
      </div>
    </div>
  );
}

function addProductToCart(product: ProductResponse, quantity: number) {
  window.dispatchEvent(new CustomEvent("shop:add-to-cart", { detail: { product, quantity } }));
}

function addItem(items: CartItem[], product: ProductResponse, quantity: number) {
  const image = primaryImage(product);
  const requestedQuantity = Math.max(1, quantity);
  const existingItem = items.find((item) => item.productId === product.id);

  if (existingItem) {
    return items.map((item) =>
      item.productId === product.id
        ? {
            ...item,
            quantity: Math.min(item.stockQuantity, item.quantity + requestedQuantity),
          }
        : item,
    );
  }

  return [
    ...items,
    {
      currency: product.currency,
      imageId: image?.id,
      name: product.name,
      priceAmount: Number(product.priceAmount),
      productId: product.id,
      productSlug: product.slug,
      quantity: Math.min(product.stockQuantity, requestedQuantity),
      stockQuantity: product.stockQuantity,
    },
  ];
}

function updateQuantity(items: CartItem[], productId: string, quantity: number) {
  return items.map((item) =>
    item.productId === productId
      ? {
          ...item,
          quantity: Math.max(1, Math.min(item.stockQuantity, quantity)),
        }
      : item,
  );
}

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function rememberOrderPhone(slug: string, orderNumber: string, phone: string) {
  window.sessionStorage.setItem(`neutrino-shop-order:${slug}:${orderNumber}`, phone);
}
