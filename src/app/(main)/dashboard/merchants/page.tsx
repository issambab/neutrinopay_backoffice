import type { ComponentType } from "react";

import Link from "next/link";

import { Building2, GitFork, MapPin, Plus, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listBusinesses } from "@/lib/organization/organization.server";

import { MerchantsTable } from "./_components/merchants-table";

type MerchantsPageProps = {
  searchParams?: Promise<{
    businessType?: string;
    page?: string;
    size?: string;
    sort?: string;
    status?: string;
  }>;
};

const PAGE_SIZE = 20;

export default async function MerchantsPage({ searchParams }: MerchantsPageProps) {
  const params = await searchParams;
  const page = toPageNumber(params?.page);
  const pageSize = toPageSize(params?.size);
  const sort = toBusinessSort(params?.sort);
  const filters = {
    businessType: params?.businessType ?? "",
    status: params?.status ?? "",
  };

  try {
    const businesses = await listBusinesses({ page, size: pageSize, sort, ...filters });
    const activeCount = businesses.content.filter((business) => business.status === "active").length;
    const zones = new Set(businesses.content.map((business) => business.zone).filter(Boolean)).size;

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Marchands</h1>
            <p className="text-muted-foreground text-sm">
              Onboarding et gestion des marchands, stations, points de vente et terminaux.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/merchants/tree">
                <GitFork />
                Arborescence
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/merchants/new">
                <Plus />
                Nouveau marchand
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard icon={Store} label="Marchands" value={businesses.totalElements.toString()} />
          <MetricCard icon={Building2} label="Actifs sur cette page" value={activeCount.toString()} />
          <MetricCard icon={MapPin} label="Zones sur cette page" value={zones.toString()} />
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Liste des marchands</CardTitle>
          </CardHeader>
          <CardContent>
            <MerchantsTable businesses={businesses} filters={filters} pageSize={pageSize} sort={sort} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Marchands</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger les marchands.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acces indisponible</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Le backend organization ne repond pas."}
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

function toPageNumber(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function toPageSize(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : PAGE_SIZE;
}

function toBusinessSort(value?: string) {
  const allowedSorts = new Set([
    "name,asc",
    "name,desc",
    "businessType,asc",
    "businessType,desc",
    "status,asc",
    "status,desc",
    "kycStatus,asc",
    "kycStatus,desc",
    "createdAt,asc",
    "createdAt,desc",
  ]);

  return value && allowedSorts.has(value) ? value : "createdAt,desc";
}
