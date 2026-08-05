import Link from "next/link";

import { ArrowLeft, KeyRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PermissionResponse } from "@/lib/iam/iam.types";
import { listPermissions } from "@/lib/iam/roles.server";

export default async function PermissionsPage() {
  try {
    const permissions = await listPermissions({ size: 300 });
    const groupedPermissions = groupPermissionsByModule(permissions.content);

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
              <h1 className="font-semibold text-2xl tracking-tight">Catalogue permissions</h1>
              <p className="text-muted-foreground text-sm">
                Permissions globales seedees par le backend et assignees aux roles tenant.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit">
            {permissions.totalElements} permissions
          </Badge>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {groupedPermissions.map(([module, modulePermissions]) => (
            <Card key={module}>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between gap-3 text-base">
                  <span className="flex items-center gap-2">
                    <KeyRound className="size-4 text-muted-foreground" />
                    {module}
                  </span>
                  <Badge variant="outline">{modulePermissions.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {modulePermissions.map((permission) => (
                    <div key={permission.id} className="flex flex-col gap-1 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm">{permission.name}</span>
                        <Badge variant="outline">{permission.action}</Badge>
                      </div>
                      <span className="break-all font-mono text-muted-foreground text-xs">{permission.code}</span>
                      {permission.description && (
                        <p className="text-muted-foreground text-xs">{permission.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
            <CardTitle>Catalogue indisponible</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Impossible de charger les permissions."}
          </CardContent>
        </Card>
      </div>
    );
  }
}

function groupPermissionsByModule(permissions: PermissionResponse[]) {
  const groups = new Map<string, PermissionResponse[]>();
  for (const permission of permissions) {
    const module = permission.module || "global";
    groups.set(module, [...(groups.get(module) ?? []), permission]);
  }

  return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right));
}
