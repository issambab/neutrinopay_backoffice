import type { CSSProperties } from "react";

import Image from "next/image";
import { notFound } from "next/navigation";

import {
  type LucideIcon,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProductResponse } from "@/lib/commerce/commerce.types";
import { formatMoney } from "@/lib/commerce/commerce-format";
import {
  getPublicCommerceStore,
  listPublicStoreCategories,
  listPublicStoreProducts,
} from "@/lib/commerce/commerce-public.server";

import { ShopBrand } from "../_components/shop-brand";
import { ShopCart } from "../_components/shop-cart";
import { ShopProductBrowser } from "../_components/shop-product-browser";
import { primaryImage, publicProductImageUrl } from "../_components/shop-product-media";

type ShopPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ShopPage({ params }: ShopPageProps) {
  const { slug } = await params;
  const store = await getPublicCommerceStore(slug);

  if (!store) {
    notFound();
  }

  const [categories, products] = await Promise.all([
    listPublicStoreCategories(slug, { size: 100, sort: "sortOrder,asc" }),
    listPublicStoreProducts(slug, { size: 100, sort: "createdAt,desc" }),
  ]);
  const contactConfig = store.contactConfig ?? {};
  const themeConfig = store.themeConfig ?? {};
  const featuredProducts = products.content.slice(0, 3);
  const accentColor = stringRecordValue(themeConfig, "accentColor") || "#0f766e";
  const logoUrl = stringRecordValue(themeConfig, "logoUrl");
  const primaryFeaturedImage = featuredProducts.map(primaryImage).find(Boolean);

  return (
    <main
      className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_42%)] text-foreground"
      style={{ "--shop-accent": accentColor } as CSSProperties}
    >
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
          <ShopBrand logoUrl={logoUrl} name={store.displayName} />
          <div className="hidden items-center gap-2 text-muted-foreground text-sm md:flex">
            <ShieldCheck className="size-4 text-[color:var(--shop-accent)]" />
            Paiement test securise
          </div>
          <Button asChild size="sm" variant="outline">
            <a href="#catalogue">
              <ShoppingBag className="size-4" />
              Catalogue
            </a>
          </Button>
        </div>
      </header>

      <section className="border-b">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] lg:px-8 lg:py-12">
          <div className="grid content-center gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className="gap-1 border-[color:var(--shop-accent)]/25 text-[color:var(--shop-accent)]"
                variant="outline"
              >
                <ShieldCheck className="size-3.5" />
                Boutique verifiee
              </Badge>
              <Badge variant="secondary">{store.businessName}</Badge>
            </div>
            <div>
              <p className="mb-2 font-medium text-[color:var(--shop-accent)] text-sm">/shop/{store.slug}</p>
              <h1 className="max-w-3xl font-semibold text-4xl tracking-tight md:text-6xl">{store.displayName}</h1>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-7 md:text-lg">
                {store.description || "Catalogue public du marchand."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <TrustItem icon={PackageCheck} label={`${products.content.length} produit(s)`} text="Catalogue publie" />
              <TrustItem icon={Store} label={`${categories.content.length} categorie(s)`} text="Rayons actifs" />
              <TrustItem icon={Sparkles} label="Neutrino" text="Paiement simule" />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                className="bg-[color:var(--shop-accent)] text-white hover:bg-[color:var(--shop-accent)]/90"
              >
                <a href="#catalogue">
                  <Search className="size-4" />
                  Voir les produits
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="#contact">Contacter la boutique</a>
              </Button>
            </div>
          </div>

          <HeroProductShowcase imageId={primaryFeaturedImage?.id} products={featuredProducts} slug={slug} />
        </div>
      </section>

      {products.content.length === 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-12 text-center md:px-6 lg:px-8">
          <div className="rounded-lg border border-dashed bg-background p-10">
            <h2 className="font-semibold text-xl">Aucun produit publie</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Cette boutique est active, mais son catalogue public est encore vide.
            </p>
          </div>
        </section>
      ) : (
        <ShopProductBrowser categories={categories.content} products={products.content} slug={slug} />
      )}

      <section
        className="mx-auto grid max-w-7xl gap-4 px-4 pb-20 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8"
        id="contact"
      >
        <div className="rounded-lg border bg-muted/20 p-5">
          <div className="font-semibold">Commande simple</div>
          <p className="mt-2 text-muted-foreground text-sm">
            Ajoutez vos produits au panier, laissez vos coordonnees, puis confirmez le paiement test.
          </p>
        </div>
        <aside className="grid gap-3 rounded-lg border bg-background p-5">
          <div className="flex items-center gap-2 font-medium">
            <Store className="size-4 text-[color:var(--shop-accent)]" />
            {store.businessName}
          </div>
          <ContactLine icon={Mail} value={stringRecordValue(contactConfig, "email")} />
          <ContactLine icon={Phone} value={stringRecordValue(contactConfig, "phone")} />
          <ContactLine icon={MapPin} value={stringRecordValue(contactConfig, "address")} />
        </aside>
      </section>
      <ShopCart slug={slug} />
    </main>
  );
}

function HeroProductShowcase({
  imageId,
  products,
  slug,
}: {
  imageId?: string;
  products: ProductResponse[];
  slug: string;
}) {
  return (
    <div className="grid gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
        {imageId ? (
          <Image
            alt="Produit principal"
            className="object-cover"
            fill
            priority
            sizes="(min-width: 1024px) 480px, 100vw"
            src={publicProductImageUrl(imageId)}
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground text-sm">Produits</div>
        )}
        <div className="absolute right-3 bottom-3 left-3 rounded-lg border bg-background/92 p-3 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium text-sm">Selection boutique</div>
              <div className="text-muted-foreground text-xs">Produits disponibles maintenant</div>
            </div>
            <Badge variant="secondary">{products.length} mis en avant</Badge>
          </div>
        </div>
      </div>
      {products.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {products.map((product) => (
            <a
              className="rounded-lg border bg-background p-3 transition hover:border-[color:var(--shop-accent)]"
              href={`/shop/${slug}/products/${product.slug}`}
              key={product.id}
            >
              <div className="line-clamp-1 font-medium text-sm">{product.name}</div>
              <div className="mt-1 text-muted-foreground text-xs">
                {formatMoney(product.priceAmount, product.currency)}
              </div>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TrustItem({ icon: Icon, label, text }: { icon: LucideIcon; label: string; text: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <Icon className="mb-2 size-4 text-[color:var(--shop-accent)]" />
      <div className="font-semibold text-sm">{label}</div>
      <div className="text-muted-foreground text-xs">{text}</div>
    </div>
  );
}

function ContactLine({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <Icon className="size-4" />
      <span className="break-all">{value}</span>
    </div>
  );
}

function stringRecordValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}
