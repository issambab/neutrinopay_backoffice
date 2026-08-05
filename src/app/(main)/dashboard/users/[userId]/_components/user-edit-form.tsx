"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { useRouter } from "next/navigation";

import { Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { UserResponse } from "@/lib/iam/iam.types";

const USER_TYPES = [
  "platform_admin",
  "ops",
  "merchant",
  "employee",
  "cash_agent",
  "client",
  "fleet_user",
  "partner",
  "system",
];
const USER_STATUSES = ["draft", "pending", "active", "suspended", "blocked", "closed", "archived"];

type UserEditFormProps = {
  user: UserResponse;
};

export function UserEditForm({ user }: UserEditFormProps) {
  const router = useRouter();
  const [mfaEnabled, setMfaEnabled] = useState(user.mfaEnabled);
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const metadataText = String(formData.get("metadata") ?? "").trim();

    try {
      const metadata = metadataText ? (JSON.parse(metadataText) as Record<string, unknown>) : {};
      const response = await fetch(`/api/iam/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          externalReference: nullableText(formData.get("externalReference")),
          phoneNumber: nullableText(formData.get("phoneNumber")),
          email: nullableText(formData.get("email")),
          fullName: nullableText(formData.get("fullName")),
          userType: nullableText(formData.get("userType")),
          status: nullableText(formData.get("status")),
          mfaEnabled,
          metadata,
        }),
      });
      const result = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        toast.error(result?.message ?? "Impossible de modifier l'utilisateur.");
        return;
      }

      toast.success("Utilisateur modifie.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof SyntaxError ? "Metadata doit etre un JSON valide." : "Impossible de modifier l'utilisateur.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FieldGroup className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="fullName">Nom complet</FieldLabel>
          <Input id="fullName" name="fullName" defaultValue={user.fullName ?? ""} maxLength={180} />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" defaultValue={user.email ?? ""} maxLength={254} />
        </Field>
        <Field>
          <FieldLabel htmlFor="phoneNumber">Telephone</FieldLabel>
          <Input id="phoneNumber" name="phoneNumber" defaultValue={user.phoneNumber ?? ""} placeholder="+21650000001" />
        </Field>
        <Field>
          <FieldLabel htmlFor="externalReference">Reference externe</FieldLabel>
          <Input
            id="externalReference"
            name="externalReference"
            defaultValue={user.externalReference ?? ""}
            maxLength={120}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="userType">Type utilisateur</FieldLabel>
          <NativeSelect id="userType" name="userType" className="w-full" defaultValue={user.userType}>
            {USER_TYPES.map((type) => (
              <NativeSelectOption key={type} value={type}>
                {formatEnum(type)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="status">Statut</FieldLabel>
          <NativeSelect id="status" name="status" className="w-full" defaultValue={user.status}>
            {USER_STATUSES.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {formatEnum(status)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field orientation="horizontal" className="md:col-span-2">
          <Switch checked={mfaEnabled} onCheckedChange={setMfaEnabled} />
          <FieldContent>
            <FieldLabel>Authentification MFA</FieldLabel>
            <p className="text-muted-foreground text-sm">Active ou desactive le flag MFA de l'utilisateur.</p>
          </FieldContent>
        </Field>
        <Field className="md:col-span-2">
          <FieldLabel htmlFor="metadata">Metadata JSON</FieldLabel>
          <Textarea
            id="metadata"
            name="metadata"
            className="min-h-32 font-mono text-xs"
            defaultValue={JSON.stringify(user.metadata ?? {}, null, 2)}
          />
        </Field>
      </FieldGroup>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          <Save />
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

function nullableText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}
