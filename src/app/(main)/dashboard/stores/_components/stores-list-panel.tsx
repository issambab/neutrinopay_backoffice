"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ArrowRight, ExternalLink, Search, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { CommerceStoreResponse, LifecycleStatus } from "@/lib/commerce/commerce.types";
import { commerceStatusClassName, formatCommerceStatus } from "@/lib/commerce/commerce-format";

type StoresListPanelProps = {
  filters: {
    q: string;
    status: string;
  };
  stores: CommerceStoreResponse[];
};

const STATUS_OPTIONS: LifecycleStatus[] = ["pending", "active", "suspended", "archived"];

export function StoresListPanel({ filters, stores }: StoresListPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Card>
      <CardHeader className="gap-3 border-b">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Store className="size-5" />
              Liste des boutiques
            </CardTitle>
            <p className="mt-1 text-muted-foreground text-sm">
              Ouvrez une boutique pour administrer son catalogue, ses commandes et ses ventes.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,280px)_190px]">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                defaultValue={filters.q}
                onChange={(event) => updateFilter("q", event.target.value)}
                placeholder="Recherche boutique ou marchand"
              />
            </div>
            <NativeSelect
              className="w-full"
              defaultValue={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
            >
              <NativeSelectOption value="">Tous les statuts</NativeSelectOption>
              {STATUS_OPTIONS.map((status) => (
                <NativeSelectOption key={status} value={status}>
                  {formatCommerceStatus(status)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {stores.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">
            Aucune boutique ne correspond aux filtres.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stores.map((store) => (
              <article className="rounded-md border p-4 transition hover:bg-muted/40" key={store.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-base">{store.displayName}</h2>
                    <p className="truncate text-muted-foreground text-sm">{store.businessName}</p>
                  </div>
                  <Badge className={commerceStatusClassName(store.status)} variant="outline">
                    {formatCommerceStatus(store.status)}
                  </Badge>
                </div>
                <p className="mt-3 line-clamp-2 min-h-10 text-muted-foreground text-sm">
                  {store.description || "Aucune description boutique."}
                </p>
                <div className="mt-4 grid gap-2 rounded-md bg-muted/40 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">URL publique</span>
                    <span className="truncate font-medium">/shop/{store.slug}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Cree le</span>
                    <span className="font-medium">{formatDate(store.createdAt)}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href={`/dashboard/stores/${store.id}`}>
                      Detail
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/shop/${store.slug}`} target="_blank">
                      <ExternalLink className="size-4" />
                      Voir boutique
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(new Date(value));
}
