import type { CSSProperties } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPublicCommerceStore } from "@/lib/commerce/commerce-public.server";

import { ShopBrand } from "../../../_components/shop-brand";
import { ShopOrderTrackingPanel } from "../../../_components/shop-order-tracking-panel";

type ShopOrderPageProps = {
  params: Promise<{ orderNumber: string; slug: string }>;
};

export default async function ShopOrderPage({ params }: ShopOrderPageProps) {
  const { orderNumber, slug } = await params;
  const store = await getPublicCommerceStore(slug);

  if (!store) {
    notFound();
  }

  const themeConfig = store.themeConfig ?? {};
  const accentColor = stringRecordValue(themeConfig, "accentColor") || "#0f766e";
  const logoUrl = stringRecordValue(themeConfig, "logoUrl");

  return (
    <main
      className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_44%)] text-foreground"
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

      <ShopOrderTrackingPanel orderNumber={decodeURIComponent(orderNumber)} slug={slug} store={store} />
    </main>
  );
}

function stringRecordValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}
