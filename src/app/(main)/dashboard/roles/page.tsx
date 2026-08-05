import type { ComponentType } from "react";

import Link from "next/link";

import { KeyRound, Plus, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listRoles } from "@/lib/iam/roles.server";

import { RolesTable } from "./_components/roles-table";

type RolesPageProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
    size?: string;
    sort?: string;
    system?: string;
  }>;
};

const PAGE_SIZE = 20;

export default async function RolesPage({ searchParams }: RolesPageProps) {
  const params = await searchParams;
  const page = toPageNumber(params?.page);
  const pageSize = toPageSize(params?.size);
  const sort = toRolesSort(params?.sort);
  const filters = {
    q: params?.q ?? "",
    system: params?.system ?? "",
  };

  try {
    const roles = await listRoles({ page, size: pageSize, sort, ...filters });
    const systemRoles = roles.content.filter((role) => role.system).length;

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Roles & permissions</h1>
            <p className="text-muted-foreground text-sm">
              Administration RBAC du tenant courant, avec permissions techniques en catalogue read-only.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/permissions">
                <KeyRound />
                Catalogue permissions
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/roles/new">
                <Plus />
                Nouveau role
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard icon={ShieldCheck} label="Roles" value={roles.totalElements.toString()} />
          <MetricCard icon={KeyRound} label="Systeme sur cette page" value={systemRoles.toString()} />
          <MetricCard
            icon={ShieldCheck}
            label="Modifiables sur cette page"
            value={(roles.content.length - systemRoles).toString()}
          />
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Liste des roles</CardTitle>
          </CardHeader>
          <CardContent>
            <RolesTable roles={roles} filters={filters} pageSize={pageSize} sort={sort} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Roles & permissions</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger les roles IAM.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acces indisponible</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Le backend IAM ne repond pas."}
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

  if (!Number.isInteger(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function toPageSize(value?: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return PAGE_SIZE;
  }

  return parsed;
}

function toRolesSort(value?: string) {
  const allowedSorts = new Set([
    "name,asc",
    "name,desc",
    "scope,asc",
    "scope,desc",
    "system,asc",
    "system,desc",
    "createdAt,asc",
    "createdAt,desc",
  ]);

  return value && allowedSorts.has(value) ? value : "createdAt,desc";
}
