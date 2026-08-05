"use client";

import type { FormEvent } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

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
const KYC_STATUSES = ["not_started", "pending", "in_review", "verified", "rejected", "expired"];

type UsersFilterFormProps = {
  filters: {
    kyc: string;
    q: string;
    status: string;
    type: string;
  };
};

export function UsersFilterForm({ filters }: UsersFilterFormProps) {
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const searchParams = new URLSearchParams();

    appendIfPresent(searchParams, "q", formData.get("q"));
    appendIfPresent(searchParams, "status", formData.get("status"));
    appendIfPresent(searchParams, "type", formData.get("type"));
    appendIfPresent(searchParams, "kyc", formData.get("kyc"));

    const query = searchParams.toString();
    router.push(query ? `/dashboard/users?${query}` : "/dashboard/users");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_180px_180px_auto_auto]">
      <Input name="q" defaultValue={filters.q} placeholder="Email ou nom" aria-label="Recherche utilisateur" />
      <NativeSelect name="status" defaultValue={filters.status} className="w-full" aria-label="Filtrer par statut">
        <NativeSelectOption value="">Tous statuts</NativeSelectOption>
        {USER_STATUSES.map((status) => (
          <NativeSelectOption key={status} value={status}>
            {formatEnum(status)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect name="type" defaultValue={filters.type} className="w-full" aria-label="Filtrer par type">
        <NativeSelectOption value="">Tous types</NativeSelectOption>
        {USER_TYPES.map((type) => (
          <NativeSelectOption key={type} value={type}>
            {formatEnum(type)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect name="kyc" defaultValue={filters.kyc} className="w-full" aria-label="Filtrer par KYC">
        <NativeSelectOption value="">Tous KYC</NativeSelectOption>
        {KYC_STATUSES.map((kyc) => (
          <NativeSelectOption key={kyc} value={kyc}>
            {formatEnum(kyc)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Button type="submit">
        <Search />
        Filtrer
      </Button>
      <Button asChild variant="outline">
        <Link href="/dashboard/users">
          <RotateCcw />
          Reset
        </Link>
      </Button>
    </form>
  );
}

function appendIfPresent(searchParams: URLSearchParams, key: string, value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return;
  }

  const trimmed = value.trim();
  if (trimmed) {
    searchParams.set(key, trimmed);
  }
}

function formatEnum(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}
