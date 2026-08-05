import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listPermissions } from "@/lib/iam/roles.server";

import { RoleForm } from "../_components/role-form";

export default async function NewRolePage() {
  try {
    const permissions = await listPermissions({ size: 300 });

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <Button asChild variant="ghost" className="w-fit px-0">
            <Link href="/dashboard/roles">
              <ArrowLeft />
              Retour aux roles
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Nouveau role</h1>
            <p className="text-muted-foreground text-sm">
              Cree un role tenant et selectionne les permissions techniques autorisees.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Configuration du role</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleForm mode="create" permissions={permissions.content} />
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
            <CardTitle>Permissions indisponibles</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Impossible de charger le catalogue permissions."}
          </CardContent>
        </Card>
      </div>
    );
  }
}
