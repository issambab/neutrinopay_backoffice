"use client";

import { useState, useTransition } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Building2,
  Loader2,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  UserPlus,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { AgencyResponse, CashAgentContractResponse, LifecycleStatus } from "@/lib/cash/cash.types";
import { cashStatusClassName, formatCashStatus, formatMinorAmount } from "@/lib/cash/cash-format";
import type { UserResponse } from "@/lib/iam/iam.types";

type AgenciesAdminPanelProps = {
  agencies: AgencyResponse[];
  agents: UserResponse[];
  contractsByAgencyId: Record<string, CashAgentContractResponse[]>;
  filters: {
    q: string;
    status: string;
  };
};

const STATUS_OPTIONS: LifecycleStatus[] = ["pending", "active", "suspended", "closed"];

export function AgenciesAdminPanel({ agencies, agents, contractsByAgencyId, filters }: AgenciesAdminPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]">
      <Card>
        <CardHeader className="gap-3 border-b">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5" />
                Liste des agences
              </CardTitle>
              <p className="mt-1 text-muted-foreground text-sm">
                Chaque agence regroupe les agents cash autorises et leurs plafonds operationnels.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,280px)_190px]">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  defaultValue={filters.q}
                  onChange={(event) => updateFilter("q", event.target.value)}
                  placeholder="Code, nom, ville ou zone"
                />
              </div>
              <NativeSelect
                className="w-full"
                defaultValue={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
              >
                <NativeSelectOption value="">Tous les statuts</NativeSelectOption>
                {STATUS_OPTIONS.map((status) => (
                  <NativeSelectOption key={status} value={status}>
                    {formatCashStatus(status)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {agencies.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">
              Aucune agence ne correspond aux filtres.
            </div>
          ) : (
            <div className="grid gap-3">
              {agencies.map((agency) => (
                <AgencyCard
                  agency={agency}
                  agents={agents}
                  contracts={contractsByAgencyId[agency.id] ?? []}
                  key={agency.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid h-fit gap-4">
        <CreateAgencyCard />
        <CreateCashAgentCard />
      </div>
    </div>
  );
}

function AgencyCard({
  agency,
  agents,
  contracts,
}: {
  agency: AgencyResponse;
  agents: UserResponse[];
  contracts: CashAgentContractResponse[];
}) {
  const activeContracts = contracts.filter((contract) => contract.status === "active");

  return (
    <article className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-base">{agency.name}</h2>
            <Badge className={cashStatusClassName(agency.status)} variant="outline">
              {formatCashStatus(agency.status)}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground text-sm">{agency.agencyCode}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" />
              {[agency.city, agency.zone].filter(Boolean).join(" / ") || "Adresse non renseignee"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UsersRound className="size-4" />
              {activeContracts.length}/{contracts.length} agents actifs
            </span>
          </div>
        </div>
        <AssignAgentForm agencyId={agency.id} agents={agents} />
      </div>

      <div className="mt-4 grid gap-2">
        {contracts.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
            Aucun agent cash affecte a cette agence.
          </div>
        ) : (
          contracts.map((contract) => <AgentContractRow contract={contract} key={contract.id} />)
        )}
      </div>
    </article>
  );
}

function CreateAgencyCard() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      addressLine1: nullableText(formData.get("addressLine1")),
      agencyCode: normalizeTechnicalCode(formData.get("agencyCode")),
      city: nullableText(formData.get("city")),
      contactPhone: nullableText(formData.get("contactPhone")),
      countryCode: nullableText(formData.get("countryCode")) ?? "TN",
      name: String(formData.get("name") ?? "").trim(),
      status: String(formData.get("status") ?? "pending"),
      zone: nullableText(formData.get("zone")),
    };

    startTransition(async () => {
      const response = await fetch("/api/cash/agencies", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(body?.message ?? "Impossible de creer l'agence.");
        return;
      }

      form.reset();
      router.refresh();
    });
  }

  return (
    <Card className="h-fit">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Plus className="size-5" />
          Nouvelle agence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="agencyCode">Code agence</Label>
            <Input
              autoCapitalize="none"
              id="agencyCode"
              name="agencyCode"
              onInput={(event) => {
                event.currentTarget.value = normalizeTechnicalCode(event.currentTarget.value);
              }}
              pattern="[a-z][a-z0-9_]{1,63}"
              placeholder="agence_tunis_centre"
              required
              title="Utilisez uniquement des minuscules, chiffres et underscores. Exemple: agence_tunis_centre."
            />
            <p className="text-muted-foreground text-xs">
              Code technique: minuscules, chiffres et underscores uniquement.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" placeholder="Agence Tunis Centre" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Statut</Label>
            <NativeSelect id="status" name="status" defaultValue="pending">
              <NativeSelectOption value="pending">En attente</NativeSelectOption>
              <NativeSelectOption value="active">Actif</NativeSelectOption>
              <NativeSelectOption value="suspended">Suspendu</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1">
            <div className="grid gap-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" name="city" placeholder="Tunis" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zone">Zone</Label>
              <Input id="zone" name="zone" placeholder="Centre ville" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="addressLine1">Adresse</Label>
            <Input id="addressLine1" name="addressLine1" placeholder="Rue, immeuble, quartier" />
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1">
            <div className="grid gap-2">
              <Label htmlFor="countryCode">Pays</Label>
              <Input id="countryCode" name="countryCode" defaultValue="TN" maxLength={2} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPhone">Telephone</Label>
              <Input id="contactPhone" name="contactPhone" placeholder="+216..." />
            </div>
          </div>
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive text-sm">
              {error}
            </p>
          ) : null}
          <Button disabled={isPending} type="submit">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Creer l'agence
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AssignAgentForm({ agencyId, agents }: { agencyId: string; agents: UserResponse[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const agentUserId = String(formData.get("agentUserId") ?? "");

    startTransition(async () => {
      const response = await fetch(`/api/cash/agencies/${agencyId}/agents`, {
        body: JSON.stringify({
          agentUserId,
          commissionMode: "fixed",
          commissionValue: Number(formData.get("commissionValue") || 0),
          dailyLimitMinor: dinarToMinor(formData.get("dailyLimit")),
          monthlyLimitMinor: dinarToMinor(formData.get("monthlyLimit")),
          status: String(formData.get("status") || "pending"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(body?.message ?? "Impossible d'affecter l'agent.");
        return;
      }

      form.reset();
      router.refresh();
    });
  }

  return (
    <form className="grid w-full gap-2 rounded-md border bg-muted/20 p-3 lg:w-[22rem]" onSubmit={onSubmit}>
      <div className="flex items-center gap-2 text-sm">
        <UserPlus className="size-4 text-muted-foreground" />
        <span className="font-medium">Affecter agent</span>
      </div>
      <NativeSelect name="agentUserId" required>
        <NativeSelectOption value="">Selectionner un agent</NativeSelectOption>
        {agents.map((agent) => (
          <NativeSelectOption key={agent.id} value={agent.id}>
            {agent.fullName || agent.email || agent.phoneNumber || agent.id}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <div className="grid gap-2 sm:grid-cols-3">
        <NativeSelect name="status" defaultValue="pending">
          <NativeSelectOption value="pending">En attente</NativeSelectOption>
          <NativeSelectOption value="active">Actif</NativeSelectOption>
          <NativeSelectOption value="suspended">Suspendu</NativeSelectOption>
        </NativeSelect>
        <Input name="dailyLimit" inputMode="decimal" placeholder="Jour TND" />
        <Input name="monthlyLimit" inputMode="decimal" placeholder="Mois TND" />
      </div>
      <Input name="commissionValue" inputMode="decimal" placeholder="Commission fixe" />
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
      <Button disabled={isPending || agents.length === 0} size="sm" type="submit">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
        Affecter
      </Button>
    </form>
  );
}

function CreateCashAgentCard() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = nullableText(formData.get("email"));
    const phoneNumber = nullableText(formData.get("phoneNumber"));

    if (!email && !phoneNumber) {
      setError("Renseignez au moins un email ou un telephone pour l'agent.");
      return;
    }

    const payload = {
      email,
      fullName: String(formData.get("fullName") ?? "").trim(),
      mfaEnabled: false,
      password: String(formData.get("password") ?? ""),
      passwordChangeRequired: true,
      phoneNumber,
      status: String(formData.get("status") ?? "pending"),
      userType: "cash_agent",
    };

    startTransition(async () => {
      const response = await fetch("/api/iam/users", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(body?.message ?? "Impossible de creer l'agent cash.");
        return;
      }

      form.reset();
      router.refresh();
    });
  }

  return (
    <Card className="h-fit">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <UserRoundPlus className="size-5" />
          Nouvel agent cash
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="agentFullName">Nom complet</Label>
            <Input id="agentFullName" name="fullName" placeholder="Agent Tunis Centre" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agentEmail">Email</Label>
            <Input id="agentEmail" name="email" placeholder="agent@neutrino.local" type="email" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agentPhoneNumber">Telephone</Label>
            <Input id="agentPhoneNumber" name="phoneNumber" placeholder="+21620721843" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agentPassword">Mot de passe temporaire</Label>
            <Input
              id="agentPassword"
              name="password"
              placeholder="Agent@12345"
              required
              title="Minimum 8 caracteres avec une minuscule, une majuscule et un chiffre."
              type="password"
            />
            <p className="text-muted-foreground text-xs">
              L'agent devra changer ce mot de passe a la premiere connexion.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agentStatus">Statut</Label>
            <NativeSelect id="agentStatus" name="status" defaultValue="pending">
              <NativeSelectOption value="pending">En attente</NativeSelectOption>
              <NativeSelectOption value="active">Actif</NativeSelectOption>
              <NativeSelectOption value="suspended">Suspendu</NativeSelectOption>
            </NativeSelect>
          </div>
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive text-sm">
              {error}
            </p>
          ) : null}
          <Button disabled={isPending} type="submit">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <UserRoundPlus className="size-4" />}
            Creer l'agent
          </Button>
          <p className="text-muted-foreground text-xs">
            Apres creation, l'agent apparait dans la liste d'affectation des agences.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

function AgentContractRow({ contract }: { contract: CashAgentContractResponse }) {
  return (
    <div className="grid gap-3 rounded-md border bg-muted/15 p-3 text-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{contract.agentName ?? contract.agentEmail ?? "Agent cash"}</p>
          <Badge className={cashStatusClassName(contract.status)} variant="outline">
            {formatCashStatus(contract.status)}
          </Badge>
        </div>
        <p className="truncate text-muted-foreground text-xs">
          {contract.agentEmail ?? contract.agentPhoneNumber ?? contract.agentUserId}
        </p>
      </div>
      <div className="grid gap-1 text-muted-foreground text-xs sm:grid-cols-3 lg:text-right">
        <span>Jour: {formatMinorAmount(contract.dailyLimitMinor)}</span>
        <span>Mois: {formatMinorAmount(contract.monthlyLimitMinor)}</span>
        <span>Commission: {contract.commissionValue}</span>
      </div>
    </div>
  );
}

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeTechnicalCode(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function dinarToMinor(value: FormDataEntryValue | null) {
  const text = String(value ?? "")
    .replace(",", ".")
    .trim();
  if (!text) {
    return null;
  }

  const amount = Number(text);
  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount * 100);
}
