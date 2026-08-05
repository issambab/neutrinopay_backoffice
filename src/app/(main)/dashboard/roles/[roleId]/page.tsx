import type { ComponentType } from "react";

import Link from "next/link";

import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRole, listPermissions, listRolePermissions } from "@/lib/iam/roles.server";
import { cn } from "@/lib/utils";

import { RoleForm } from "../_components/role-form";

type RoleDetailPageProps = {
  params: Promise<{
    roleId: string;
  }>;
};

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  const { roleId } = await params;

  try {
    const [role, permissions, rolePermissions] = await Promise.all([
      getRole(roleId),
      listPermissions({ size: 300 }),
      listRolePermissions(roleId),
    ]);

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <Button asChild variant="ghost" className="w-fit px-0">
              <Link href="/dashboard/roles">
                <ArrowLeft />
                Retour aux roles
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold text-2xl tracking-tight">{role.name}</h1>
              <p className="break-all font-mono text-muted-foreground text-sm">{role.code}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={roleTypeClassName(role.system)}>
              {role.system ? "systeme" : "modifiable"}
            </Badge>
            <Badge variant="outline">{formatEnum(role.scope)}</Badge>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <InfoCard label="Scope" value={formatEnum(role.scope)} icon={ShieldCheck} />
          <InfoCard label="Permissions" value={rolePermissions.length.toString()} icon={KeyRound} />
          <InfoCard label="Type" value={role.system ? "Systeme" : "Tenant"} icon={ShieldCheck} />
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Modifier le role</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleForm mode="edit" role={role} permissions={permissions.content} rolePermissions={rolePermissions} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" className="w-fit px-0">
          <Link href="/dashboard/roles">
            <ArrowLeft />
            Retour aux roles
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Role indisponible</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Impossible de charger ce role."}
          </CardContent>
        </Card>
      </div>
    );
  }
}

function InfoCard({
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
          <p className="font-semibold text-lg">{value}</p>
        </div>
        <Icon className="size-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

function roleTypeClassName(system: boolean) {
  return cn(
    system && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    !system && "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
  );
}
