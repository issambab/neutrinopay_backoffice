import type { CSSProperties } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, CheckCircle2, type LucideIcon, PackageCheck, ShieldCheck, ShoppingBag, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce/commerce-format";
import { getPublicCommerceStore, getPublicStoreProduct } from "@/lib/commerce/commerce-public.server";

import { ProductGallery } from "../../../_components/product-gallery";
import { ShopBrand } from "../../../_components/shop-brand";
import { AddToCartButton, ShopCart } from "../../../_components/shop-cart";

type ProductPageProps = {
  params: Promise<{ productSlug: string; slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { productSlug, slug } = await params;
  const [store, product] = await Promise.all([getPublicCommerceStore(slug), getPublicStoreProduct(slug, productSlug)]);

  if (!store || !product) {
    notFound();
  }
  const themeConfig = store.themeConfig ?? {};
  const accentColor = stringRecordValue(themeConfig, "accentColor") || "#0f766e";
  const logoUrl = stringRecordValue(themeConfig, "logoUrl");
  const hasStock = product.stockQuantity > 0;

  return (
    <main
      className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_40%)] text-foreground"
      style={{ "--shop-accent": accentColor } as CSSProperties}
    >
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
          <ShopBrand logoUrl={logoUrl} name={store.displayName} />
          <Button asChild size="sm" variant="outline">
            <Link href={`/shop/${slug}`}>
              <ArrowLeft className="size-4" />
              Boutique
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-6 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:px-8 lg:py-12">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ProductGallery product={product} />
        </div>

        <section className="grid content-start gap-6">
          <Button asChild className="w-fit" variant="ghost">
            <Link href={`/shop/${slug}`}>
              <ArrowLeft className="size-4" />
              Retour boutique
            </Link>
          </Button>

          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1" variant="secondary">
                <Store className="size-3.5" />
                {store.displayName}
              </Badge>
              <Badge variant="outline">{product.categoryName ?? "Catalogue"}</Badge>
              <Badge
                className={hasStock ? "border-[color:var(--shop-accent)]/25 text-[color:var(--shop-accent)]" : ""}
                variant={hasStock ? "outline" : "destructive"}
              >
                {hasStock ? "Disponible" : "Rupture"}
              </Badge>
            </div>
            <h1 className="font-semibold text-4xl tracking-tight md:text-5xl">{product.name}</h1>
            <p className="text-base text-muted-foreground leading-7 md:text-lg">
              {product.description || "Produit disponible dans cette boutique."}
            </p>
          </div>

          <div className="rounded-lg border bg-background p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-muted-foreground text-sm">Prix</div>
                <div className="font-semibold text-3xl text-[color:var(--shop-accent)]">
                  {formatMoney(product.priceAmount, product.currency)}
                </div>
              </div>
              <AddToCartButton className="h-11 w-full sm:w-fit" product={product} />
            </div>
            <div className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-3">
              <Info label="Stock" value={hasStock ? `${product.stockQuantity} disponible(s)` : "Rupture"} />
              <Info label="Categorie" value={product.categoryName ?? "Catalogue"} />
              <Info label="SKU" value={product.sku ?? "-"} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Info icon={ShoppingBag} label="Commande" value="Panier rapide" />
            <Info icon={PackageCheck} label="Paiement" value="Simulation integree" />
            <Info icon={ShieldCheck} label="Confiance" value="Boutique verifiee" />
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="size-4 text-[color:var(--shop-accent)]" />
              Comment ca marche
            </div>
            <p className="mt-2 text-muted-foreground text-sm">
              Ajoutez ce produit au panier, confirmez vos coordonnees, puis simulez le paiement de la commande.
            </p>
          </div>
        </section>
      </div>
      <ShopCart slug={slug} />
    </main>
  );
}

function Info({ icon: Icon, label, value }: { icon?: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {Icon ? <Icon className="size-3.5 text-[color:var(--shop-accent)]" /> : null}
        {label}
      </div>
      <div className="mt-1 font-semibold text-sm">{value}</div>
    </div>
  );
}

function stringRecordValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}
