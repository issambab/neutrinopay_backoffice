import type { ComponentType } from "react";

import { Archive, PackageCheck, Store } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminCommerceStores } from "@/lib/commerce/commerce.server";
import type { CommerceStoreResponse } from "@/lib/commerce/commerce.types";

import { StoresListPanel } from "./_components/stores-list-panel";

type StoresPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
};

export default async function StoresPage({ searchParams }: StoresPageProps) {
  const params = await searchParams;
  const filters = {
    q: params?.q ?? "",
    status: params?.status ?? "",
  };

  try {
    const stores = await listAdminCommerceStores({
      size: 100,
      sort: "createdAt,desc",
      status: filters.status || undefined,
    });
    const filteredStores = filterStores(stores.content, filters.q);

    const activeStores = stores.content.filter((store) => store.status === "active").length;
    const inactiveStores = stores.content.length - activeStores;

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Boutiques marchands</h1>
          <p className="text-muted-foreground text-sm">
            Supervision des vitrines commerce, statuts de publication et catalogue associe.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard icon={Store} label="Boutiques" value={stores.totalElements.toString()} />
          <MetricCard icon={PackageCheck} label="Actives" value={activeStores.toString()} />
          <MetricCard icon={Archive} label="A surveiller" value={inactiveStores.toString()} />
          <MetricCard icon={Store} label="Affichees" value={filteredStores.length.toString()} />
        </div>

        <StoresListPanel filters={filters} stores={filteredStores} />
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Boutiques marchands</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger les boutiques marchands.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acces indisponible</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Le backend commerce ne repond pas."}
          </CardContent>
        </Card>
      </div>
    );
  }
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="font-semibold text-2xl">{value}</p>
        </div>
        <Icon className="size-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function filterStores(stores: CommerceStoreResponse[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return stores;
  }

  return stores.filter(
    (store) =>
      store.displayName.toLowerCase().includes(normalizedQuery) ||
      store.businessName.toLowerCase().includes(normalizedQuery) ||
      store.slug.toLowerCase().includes(normalizedQuery),
  );
}
