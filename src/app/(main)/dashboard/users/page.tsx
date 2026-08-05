import type { ComponentType } from "react";

import { ShieldCheck, UserRoundCheck, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listUsers } from "@/lib/iam/users.server";

import { UsersTable } from "./_components/users-table";

type UsersPageProps = {
  searchParams?: Promise<{
    kyc?: string;
    page?: string;
    q?: string;
    size?: string;
    sort?: string;
    status?: string;
    type?: string;
  }>;
};

const PAGE_SIZE = 20;

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const page = toPageNumber(params?.page);
  const pageSize = toPageSize(params?.size);
  const sort = toUsersSort(params?.sort);
  const filters = {
    kyc: params?.kyc ?? "",
    q: params?.q ?? "",
    status: params?.status ?? "",
    type: params?.type ?? "",
  };

  try {
    const users = await listUsers({ page, size: pageSize, sort, ...filters });
    const activeUsers = users.content.filter((user) => user.status === "active").length;
    const mfaUsers = users.content.filter((user) => user.mfaEnabled).length;

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Utilisateurs</h1>
            <p className="text-muted-foreground text-sm">
              Comptes IAM du tenant courant, synchronises avec le backend NetrinoPay.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {users.totalElements} utilisateurs
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard icon={UsersRound} label="Total" value={users.totalElements.toString()} />
          <MetricCard icon={UserRoundCheck} label="Actifs sur cette page" value={activeUsers.toString()} />
          <MetricCard icon={ShieldCheck} label="MFA active sur cette page" value={mfaUsers.toString()} />
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Liste des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <UsersTable users={users} filters={filters} pageSize={pageSize} sort={sort} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Utilisateurs</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger la liste des utilisateurs.</p>
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

function toUsersSort(value?: string) {
  const allowedSorts = new Set([
    "fullName,asc",
    "fullName,desc",
    "userType,asc",
    "userType,desc",
    "status,asc",
    "status,desc",
    "kycStatus,asc",
    "kycStatus,desc",
    "mfaEnabled,asc",
    "mfaEnabled,desc",
    "createdAt,asc",
    "createdAt,desc",
  ]);

  return value && allowedSorts.has(value) ? value : "createdAt,desc";
}
