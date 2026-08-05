"use client";

import { useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { ArrowUpRight, PackageCheck, Search, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductCategoryResponse, ProductResponse } from "@/lib/commerce/commerce.types";
import { formatMoney } from "@/lib/commerce/commerce-format";

import { AddToCartButton } from "./shop-cart";
import { primaryImage, publicProductImageUrl } from "./shop-product-media";

type ShopProductBrowserProps = {
  categories: ProductCategoryResponse[];
  products: ProductResponse[];
  slug: string;
};

export function ShopProductBrowser({ categories, products, slug }: ShopProductBrowserProps) {
  const [categoryId, setCategoryId] = useState("all");
  const [query, setQuery] = useState("");
  const filteredProducts = useMemo(() => filterProducts(products, categoryId, query), [categoryId, products, query]);

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 md:px-6 lg:px-8" id="catalogue">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-medium text-[color:var(--shop-accent)] text-sm">Catalogue</p>
          <h2 className="font-semibold text-3xl tracking-tight">Produits disponibles</h2>
          <p className="mt-2 text-muted-foreground text-sm">
            {filteredProducts.length} produit(s) affiche(s) sur {products.length}
          </p>
        </div>
        <div className="w-full max-w-xl">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 rounded-lg bg-background pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un produit, une reference..."
              value={query}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <CategoryChip active={categoryId === "all"} label="Tous" onClick={() => setCategoryId("all")} />
        {categories.map((category) => (
          <CategoryChip
            active={categoryId === category.id}
            key={category.id}
            label={category.name}
            onClick={() => setCategoryId(category.id)}
          />
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-background p-10 text-center">
          <SlidersHorizontal className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Aucun produit trouve</p>
          <p className="text-muted-foreground text-sm">Essayez une autre recherche ou une autre categorie.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} slug={slug} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProductCard({ product, slug }: { product: ProductResponse; slug: string }) {
  const image = primaryImage(product);
  const hasStock = product.stockQuantity > 0;

  return (
    <article className="group grid overflow-hidden rounded-lg border bg-background shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--shop-accent)] hover:shadow-md">
      <Link className="relative aspect-[4/3] bg-muted" href={`/shop/${slug}/products/${product.slug}`}>
        {image ? (
          <Image
            alt={product.name}
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            src={publicProductImageUrl(image.id)}
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground text-sm">Sans image</div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge className="bg-background/90 text-foreground backdrop-blur" variant="secondary">
            {product.categoryName ?? "Catalogue"}
          </Badge>
          <Badge
            className={hasStock ? "bg-background/90 text-foreground backdrop-blur" : ""}
            variant={hasStock ? "secondary" : "destructive"}
          >
            {hasStock ? "En stock" : "Rupture"}
          </Badge>
        </div>
      </Link>
      <div className="grid gap-4 p-4">
        <div>
          <div className="grid gap-2">
            <Link
              className="line-clamp-2 font-semibold text-lg hover:underline"
              href={`/shop/${slug}/products/${product.slug}`}
            >
              {product.name}
            </Link>
            <span className="font-semibold text-[color:var(--shop-accent)] text-xl">
              {formatMoney(product.priceAmount, product.currency)}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-muted-foreground text-sm">
            {product.description ?? "Produit disponible."}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 text-muted-foreground text-sm">
          <span className="flex items-center gap-1.5">
            <PackageCheck className="size-4" />
            {hasStock ? `${product.stockQuantity} disponible(s)` : "Non disponible"}
          </span>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/shop/${slug}/products/${product.slug}`}>
              Detail
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
        <AddToCartButton className="w-full" product={product} />
      </div>
    </article>
  );
}

function CategoryChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={
        active
          ? "whitespace-nowrap rounded-lg bg-[color:var(--shop-accent)] px-4 py-2 font-medium text-sm text-white"
          : "whitespace-nowrap rounded-lg border bg-background px-4 py-2 font-medium text-muted-foreground text-sm transition hover:border-[color:var(--shop-accent)] hover:text-foreground"
      }
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function filterProducts(products: ProductResponse[], categoryId: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory = categoryId === "all" || product.categoryId === categoryId;
    const matchesQuery =
      !normalizedQuery ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.slug.toLowerCase().includes(normalizedQuery) ||
      product.description?.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}
