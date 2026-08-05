"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { PermissionResponse, RoleResponse, RoleScope } from "@/lib/iam/iam.types";

const ROLE_SCOPES: RoleScope[] = ["platform", "tenant", "business", "station", "wallet", "fleet_company", "terminal"];

type RoleFormProps = {
  mode: "create" | "edit";
  permissions: PermissionResponse[];
  role?: RoleResponse;
  rolePermissions?: PermissionResponse[];
};

export function RoleForm({ mode, permissions, role, rolePermissions = [] }: RoleFormProps) {
  const router = useRouter();
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(
    () => new Set(rolePermissions.map((item) => item.id)),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isSystemRole = Boolean(role?.system);
  const isEditMode = mode === "edit";
  const groupedPermissions = useMemo(() => groupPermissionsByModule(permissions), [permissions]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSystemRole) {
      toast.error("Les roles systeme ne peuvent pas etre modifies.");
      return;
    }

    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    const payload = {
      code: nullableText(formData.get("code")) ?? "",
      name: nullableText(formData.get("name")),
      scope: nullableText(formData.get("scope")) as RoleScope | null,
      description: nullableText(formData.get("description")),
      permissionIds: Array.from(selectedPermissionIds),
    };

    try {
      const response = await fetch(isEditMode && role ? `/api/iam/roles/${role.id}` : "/api/iam/roles", {
        method: isEditMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(isEditMode ? omitCode(payload) : payload),
      });
      const result = (await response.json().catch(() => null)) as { message?: string; role?: RoleResponse } | null;

      if (!response.ok || !result?.role) {
        toast.error(result?.message ?? "Impossible d'enregistrer le role.");
        return;
      }

      toast.success(isEditMode ? "Role modifie." : "Role cree.");
      if (isEditMode) {
        router.refresh();
      } else {
        router.push(`/dashboard/roles/${result.role.id}`);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function onDelete() {
    if (!role || role.system) {
      toast.error("Ce role ne peut pas etre supprime.");
      return;
    }
    if (!window.confirm("Supprimer ce role ? Cette action est definitive cote backoffice.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/iam/roles/${role.id}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        toast.error(result?.message ?? "Impossible de supprimer le role.");
        return;
      }

      toast.success("Role supprime.");
      router.push("/dashboard/roles");
    } finally {
      setIsDeleting(false);
    }
  }

  function togglePermission(permissionId: string, checked: boolean) {
    setSelectedPermissionIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(permissionId);
      } else {
        next.delete(permissionId);
      }
      return next;
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FieldGroup className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="code">Code technique</FieldLabel>
          <Input
            id="code"
            name="code"
            defaultValue={role?.code ?? ""}
            disabled={isEditMode || isSystemRole}
            maxLength={80}
            pattern="^[a-z][a-z0-9_.:-]*$"
            placeholder="ops_manager"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="name">Nom</FieldLabel>
          <Input
            id="name"
            name="name"
            defaultValue={role?.name ?? ""}
            disabled={isSystemRole}
            maxLength={140}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="scope">Scope</FieldLabel>
          <NativeSelect
            id="scope"
            name="scope"
            className="w-full"
            defaultValue={role?.scope ?? "tenant"}
            disabled={isSystemRole}
          >
            {ROLE_SCOPES.map((scope) => (
              <NativeSelectOption key={scope} value={scope}>
                {formatEnum(scope)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field className="md:col-span-2">
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            defaultValue={role?.description ?? ""}
            disabled={isSystemRole}
            maxLength={500}
            placeholder="Responsabilites principales du role"
          />
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium text-base">Permissions</h2>
          <p className="text-muted-foreground text-sm">
            {selectedPermissionIds.size} permission{selectedPermissionIds.size > 1 ? "s" : ""} selectionnee
            {selectedPermissionIds.size > 1 ? "s" : ""}.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {groupedPermissions.map(([module, modulePermissions]) => (
            <div key={module} className="rounded-lg border">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="font-medium text-sm">{module}</h3>
                <Badge variant="outline">{modulePermissions.length}</Badge>
              </div>
              <div className="divide-y">
                {modulePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-start gap-3 px-4 py-3">
                    <Checkbox
                      checked={selectedPermissionIds.has(permission.id)}
                      disabled={isSystemRole}
                      onCheckedChange={(checked) => togglePermission(permission.id, checked === true)}
                      aria-label={`Permission ${permission.code}`}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="break-words font-medium text-sm">{permission.name}</span>
                      <span className="break-all font-mono text-muted-foreground text-xs">{permission.code}</span>
                      {permission.description && (
                        <span className="text-muted-foreground text-xs">{permission.description}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {isSystemRole
            ? "Role systeme: modification et suppression desactivees."
            : "Les changements sont appliques au tenant courant."}
        </p>
        <div className="flex justify-end gap-2">
          {isEditMode && role && !role.system && (
            <Button type="button" variant="outline" onClick={onDelete} disabled={isDeleting || isSaving}>
              <Trash2 />
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          )}
          <Button type="submit" disabled={isSaving || isSystemRole}>
            <Save />
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function groupPermissionsByModule(permissions: PermissionResponse[]) {
  const groups = new Map<string, PermissionResponse[]>();
  for (const permission of permissions) {
    const module = permission.module || "global";
    groups.set(module, [...(groups.get(module) ?? []), permission]);
  }

  return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right));
}

function nullableText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function omitCode(payload: {
  code: string;
  name: string | null;
  scope: RoleScope | null;
  description: string | null;
  permissionIds: string[];
}) {
  return {
    name: payload.name,
    scope: payload.scope,
    description: payload.description,
    permissionIds: payload.permissionIds,
  };
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}
