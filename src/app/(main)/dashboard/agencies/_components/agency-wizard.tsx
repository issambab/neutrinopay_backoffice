"use client";

import type { FormEvent, InputHTMLAttributes } from "react";
import { useMemo, useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import type {
  AgencyResponse,
  CashAgentContractResponse,
  CreateAgencyRequest,
  CreateCashAgentContractRequest,
  LifecycleStatus,
  UpdateAgencyRequest,
} from "@/lib/cash/cash.types";
import { cashStatusClassName, formatCashStatus, formatMinorAmount } from "@/lib/cash/cash-format";
import type { CreateUserRequest, UserResponse } from "@/lib/iam/iam.types";

type AgencyWizardProps = {
  contracts: CashAgentContractResponse[];
  initialAgency?: AgencyResponse | null;
};

const STATUSES: LifecycleStatus[] = ["pending", "active", "suspended"];
const CONTRACT_STATUSES: LifecycleStatus[] = ["pending", "active", "suspended", "closed"];

export function AgencyWizard({ contracts: initialContracts, initialAgency = null }: AgencyWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(initialAgency ? 2 : 1);
  const [agency, setAgency] = useState<AgencyResponse | null>(initialAgency);
  const [contracts, setContracts] = useState(initialContracts);
  const [isSaving, startTransition] = useTransition();
  const canManageAgents = Boolean(agency);
  const activeContracts = contracts.filter((contract) => contract.status === "active");
  const progress = useMemo(
    () => [
      { id: 1, label: "Informations agence", done: Boolean(agency) },
      { id: 2, label: "Agents", done: activeContracts.length > 0 },
    ],
    [activeContracts.length, agency],
  );

  function submitAgency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const status = requiredText(formData.get("status")) as LifecycleStatus;
    const payload: CreateAgencyRequest = {
      addressLine1: nullableText(formData.get("addressLine1")),
      addressLine2: nullableText(formData.get("addressLine2")),
      agencyCode: normalizeTechnicalCode(formData.get("agencyCode")),
      city: nullableText(formData.get("city")),
      contactEmail: nullableText(formData.get("contactEmail")),
      contactPhone: nullableText(formData.get("contactPhone")),
      countryCode: normalizeCountry(formData.get("countryCode")) ?? "TN",
      name: requiredText(formData.get("name")),
      region: nullableText(formData.get("region")),
      status,
      zone: nullableText(formData.get("zone")),
    };

    startTransition(async () => {
      try {
        if (agency) {
          const updatePayload: UpdateAgencyRequest = {
            addressLine1: payload.addressLine1,
            addressLine2: payload.addressLine2,
            agencyCode: payload.agencyCode,
            city: payload.city,
            contactEmail: payload.contactEmail,
            contactPhone: payload.contactPhone,
            countryCode: payload.countryCode,
            name: payload.name,
            region: payload.region,
            zone: payload.zone,
          };
          const response = await fetch(`/api/cash/agencies/${agency.id}`, jsonRequest("PATCH", updatePayload));
          const result = (await response.json().catch(() => null)) as {
            agency?: AgencyResponse;
            message?: string;
          } | null;
          if (!response.ok || !result?.agency) {
            toast.error(result?.message ?? "Impossible de modifier l'agence.");
            return;
          }

          let nextAgency = result.agency;
          if (status !== agency.status) {
            const statusResponse = await fetch(
              `/api/cash/agencies/${agency.id}/status`,
              jsonRequest("PATCH", { status }),
            );
            const statusResult = (await statusResponse.json().catch(() => null)) as {
              agency?: AgencyResponse;
              message?: string;
            } | null;
            if (!statusResponse.ok || !statusResult?.agency) {
              toast.error(statusResult?.message ?? "Agence modifiee, mais statut non mis a jour.");
              setAgency(nextAgency);
              return;
            }
            nextAgency = statusResult.agency;
          }

          setAgency(nextAgency);
          toast.success("Agence modifiee.");
          router.refresh();
          return;
        }

        const response = await fetch("/api/cash/agencies", jsonRequest("POST", payload));
        const result = (await response.json().catch(() => null)) as {
          agency?: AgencyResponse;
          message?: string;
        } | null;
        if (!response.ok || !result?.agency) {
          toast.error(result?.message ?? "Impossible de creer l'agence.");
          return;
        }

        setAgency(result.agency);
        setStep(2);
        toast.success("Agence creee.");
      } finally {
        router.refresh();
      }
    });
  }

  async function assignAgent(payload: CreateCashAgentContractRequest) {
    if (!agency) {
      toast.error("Creez d'abord l'agence.");
      return null;
    }

    const response = await fetch(`/api/cash/agencies/${agency.id}/agents`, jsonRequest("POST", payload));
    const result = (await response.json().catch(() => null)) as {
      contract?: CashAgentContractResponse;
      message?: string;
    } | null;
    if (!response.ok || !result?.contract) {
      toast.error(result?.message ?? "Impossible d'ajouter l'agent a cette agence.");
      return null;
    }

    const contract = result.contract;
    setContracts((current) => [contract, ...current]);
    toast.success("Agent ajoute a cette agence.");
    router.refresh();
    return contract;
  }

  function submitNewAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = nullableText(formData.get("email"));
    const phoneNumber = nullableText(formData.get("phoneNumber"));
    if (!email && !phoneNumber) {
      toast.error("Renseignez au moins un email ou un telephone.");
      return;
    }

    const userPayload: CreateUserRequest = {
      email,
      fullName: requiredText(formData.get("fullName")),
      mfaEnabled: false,
      password: requiredText(formData.get("password")),
      passwordChangeRequired: true,
      phoneNumber,
      status: requiredText(formData.get("userStatus")) || "pending",
      userType: "cash_agent",
    };

    startTransition(async () => {
      const userResponse = await fetch("/api/iam/users", jsonRequest("POST", userPayload));
      const userResult = (await userResponse.json().catch(() => null)) as {
        message?: string;
        user?: UserResponse;
      } | null;
      if (!userResponse.ok || !userResult?.user) {
        toast.error(userResult?.message ?? "Impossible de creer l'agent cash.");
        return;
      }

      const user = userResult.user;
      const contract = await assignAgent(contractPayload(formData, user.id));
      if (contract) {
        form.reset();
      }
    });
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2 md:grid-cols-2">
        {progress.map((item) => (
          <button
            key={item.id}
            type="button"
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm"
            onClick={() => setStep(item.id)}
          >
            {item.done ? (
              <CheckCircle2 className="size-4 text-green-600" />
            ) : (
              <Circle className="size-4 text-muted-foreground" />
            )}
            <span className={step === item.id ? "font-medium" : "text-muted-foreground"}>{item.label}</span>
          </button>
        ))}
      </div>

      {agency ? (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3 text-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{agency.name}</span>
            <Badge className={cashStatusClassName(agency.status)} variant="outline">
              {formatCashStatus(agency.status)}
            </Badge>
            <span className="font-mono text-muted-foreground text-xs">{agency.agencyCode}</span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/agencies/${agency.id}`}>Ouvrir le detail</Link>
          </Button>
        </div>
      ) : null}

      {step === 1 ? (
        <form onSubmit={submitAgency} className="grid gap-5">
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <TextField
              name="agencyCode"
              label="Code agence"
              defaultValue={agency?.agencyCode ?? ""}
              onInput={(event) => {
                event.currentTarget.value = normalizeTechnicalCode(event.currentTarget.value);
              }}
              pattern="[a-z][a-z0-9_]{1,63}"
              placeholder="agence_tunis_centre"
              required
            />
            <TextField name="name" label="Nom agence" defaultValue={agency?.name ?? ""} required />
            <SelectField name="status" label="Statut" options={STATUSES} defaultValue={agency?.status ?? "pending"} />
            <TextField
              name="contactEmail"
              label="Email contact"
              defaultValue={agency?.contactEmail ?? ""}
              type="email"
            />
            <TextField name="contactPhone" label="Telephone contact" defaultValue={agency?.contactPhone ?? ""} />
            <TextField name="addressLine1" label="Adresse" defaultValue={agency?.addressLine1 ?? ""} />
            <TextField name="addressLine2" label="Complement adresse" defaultValue={agency?.addressLine2 ?? ""} />
            <TextField name="city" label="Ville" defaultValue={agency?.city ?? ""} />
            <TextField name="region" label="Region" defaultValue={agency?.region ?? ""} />
            <TextField name="countryCode" label="Pays ISO" defaultValue={agency?.countryCode ?? "TN"} maxLength={2} />
            <TextField name="zone" label="Zone" defaultValue={agency?.zone ?? ""} />
          </FieldGroup>
          <WizardActions
            isSaving={isSaving}
            primaryLabel={agency ? "Enregistrer l'agence" : "Creer l'agence"}
            nextLabel={agency ? "Passer aux agents" : undefined}
            onNext={agency ? () => setStep(2) : undefined}
          />
        </form>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-5">
          <DisabledHint enabled={canManageAgents} text="Creez l'agence avant d'ajouter des agents." />

          <form onSubmit={submitNewAgent} className="grid gap-4 rounded-lg border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <UserRoundPlus className="size-4 text-muted-foreground" />
                <p className="font-medium text-sm">Creer un agent cash</p>
              </div>
              {agency ? (
                <Badge variant="outline" className="w-fit">
                  Agence: {agency.name}
                </Badge>
              ) : null}
            </div>
            <FieldGroup className="grid gap-3 md:grid-cols-2">
              <TextField name="fullName" label="Nom complet" required />
              <TextField name="email" label="Email" type="email" />
              <TextField name="phoneNumber" label="Telephone" />
              <TextField name="password" label="Mot de passe temporaire" type="password" required />
              <SelectField name="userStatus" label="Statut agent" options={STATUSES} defaultValue="pending" />
            </FieldGroup>
            <Separator />
            <ContractFields />
            <Button disabled={!canManageAgents || isSaving} type="submit" className="w-full sm:w-fit">
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <UserRoundPlus className="size-4" />}
              Creer l'agent
            </Button>
          </form>

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm">Agents de cette agence</p>
                <p className="text-muted-foreground text-sm">
                  {activeContracts.length}/{contracts.length} agents actifs
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Modifier l'agence
              </Button>
            </div>
            {contracts.length ? (
              contracts.map((contract) => (
                <AgentContractRow
                  contract={contract}
                  key={contract.id}
                  onSaved={(nextContract) =>
                    setContracts((current) =>
                      current.map((currentContract) =>
                        currentContract.id === nextContract.id ? nextContract : currentContract,
                      ),
                    )
                  }
                />
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
                Aucun agent cash dans cette agence.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ContractFields() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <SelectField name="status" label="Statut contrat" options={STATUSES} defaultValue="pending" />
      <TextField
        name="commissionValue"
        label="Commission agent %"
        inputMode="decimal"
        placeholder="0"
        type="number"
        step="0.01"
      />
      <TextField
        name="platformCommissionSharePercent"
        label="Part plateforme %"
        inputMode="decimal"
        max={100}
        min={0}
        placeholder="0"
        type="number"
        step="0.01"
      />
      <TextField name="dailyLimit" label="Plafond jour TND" inputMode="decimal" />
      <TextField name="monthlyLimit" label="Plafond mois TND" inputMode="decimal" />
    </div>
  );
}

function AgentContractRow({
  contract,
  onSaved,
}: {
  contract: CashAgentContractResponse;
  onSaved: (contract: CashAgentContractResponse) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return <EditAgentContractForm contract={contract} onCancel={() => setIsEditing(false)} onSaved={onSaved} />;
  }

  return (
    <div className="grid gap-3 rounded-md border bg-muted/10 p-3 text-sm xl:grid-cols-[minmax(14rem,1fr)_minmax(0,32rem)_auto] xl:items-center">
      <div className="min-w-0 border-b pb-3 xl:border-b-0 xl:pb-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 truncate font-medium">{contract.agentName ?? contract.agentEmail ?? "Agent cash"}</p>
          <Badge className={cashStatusClassName(contract.status)} variant="outline">
            {formatCashStatus(contract.status)}
          </Badge>
        </div>
        <p className="truncate text-muted-foreground text-xs">
          {contract.agentEmail ?? contract.agentPhoneNumber ?? contract.agentUserId}
        </p>
      </div>
      <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <ContractMetric icon={CalendarClock} label="Plafond jour" value={formatMinorAmount(contract.dailyLimitMinor)} />
        <ContractMetric
          icon={CalendarClock}
          label="Plafond mois"
          value={formatMinorAmount(contract.monthlyLimitMinor)}
        />
        <ContractMetric icon={SlidersHorizontal} label="Commission" value={`${contract.commissionValue}%`} />
        <ContractMetric
          icon={ShieldCheck}
          label="Part plateforme"
          value={`${contract.platformCommissionSharePercent}%`}
        />
      </div>
      <Button type="button" variant="outline" size="sm" className="w-full xl:w-fit" onClick={() => setIsEditing(true)}>
        Modifier
      </Button>
    </div>
  );
}

function EditAgentContractForm({
  contract,
  onCancel,
  onSaved,
}: {
  contract: CashAgentContractResponse;
  onCancel: () => void;
  onSaved: (contract: CashAgentContractResponse) => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const status = String(formData.get("status") || contract.status);

    startTransition(async () => {
      const response = await fetch(`/api/cash/agencies/${contract.agencyId}/agents/${contract.id}`, {
        body: JSON.stringify({
          commissionMode: "percent",
          commissionValue: Number(formData.get("commissionValue") || 0),
          dailyLimitMinor: dinarToMinor(formData.get("dailyLimit")) ?? 0,
          monthlyLimitMinor: dinarToMinor(formData.get("monthlyLimit")) ?? 0,
          platformCommissionSharePercent: Number(formData.get("platformCommissionSharePercent") || 0),
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const body = (await response.json().catch(() => null)) as {
        contract?: CashAgentContractResponse;
        message?: string;
      } | null;

      if (!response.ok || !body?.contract) {
        setError(body?.message ?? "Impossible de modifier le contrat.");
        return;
      }

      let nextContract = body.contract;
      if (status !== contract.status) {
        const statusResponse = await fetch(`/api/cash/agencies/${contract.agencyId}/agents/${contract.id}/status`, {
          body: JSON.stringify({ status }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });
        const statusBody = (await statusResponse.json().catch(() => null)) as {
          contract?: CashAgentContractResponse;
          message?: string;
        } | null;
        if (!statusResponse.ok || !statusBody?.contract) {
          setError(statusBody?.message ?? "Contrat modifie, mais le statut n'a pas ete mis a jour.");
          return;
        }
        nextContract = statusBody.contract;
      }

      onSaved(nextContract);
      onCancel();
      router.refresh();
    });
  }

  return (
    <form className="grid gap-3 rounded-md border border-sky-200 bg-sky-50/40 p-3 text-sm" onSubmit={onSubmit}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Modifier le contrat</p>
          <p className="text-muted-foreground text-xs">
            {contract.agentName ?? contract.agentEmail ?? contract.agentUserId}
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={onCancel}>
          <span className="sr-only">Annuler</span>
          <X className="size-4" />
        </Button>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        <SelectField name="status" label="Statut" options={CONTRACT_STATUSES} defaultValue={contract.status} />
        <TextField
          name="commissionValue"
          label="Commission agent %"
          defaultValue={contract.commissionValue}
          inputMode="decimal"
          min={0}
          step="0.01"
          type="number"
        />
        <TextField
          name="platformCommissionSharePercent"
          label="Part plateforme %"
          defaultValue={contract.platformCommissionSharePercent}
          inputMode="decimal"
          max={100}
          min={0}
          step="0.01"
          type="number"
        />
        <TextField
          name="dailyLimit"
          label="Plafond jour TND"
          defaultValue={minorToDinar(contract.dailyLimitMinor)}
          inputMode="decimal"
        />
        <TextField
          name="monthlyLimit"
          label="Plafond mois TND"
          defaultValue={minorToDinar(contract.monthlyLimitMinor)}
          inputMode="decimal"
        />
      </div>

      {error ? <p className="text-destructive text-xs">{error}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          <X className="size-4" />
          Annuler
        </Button>
        <Button disabled={isPending} size="sm" type="submit">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

function ContractMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <span className="grid min-w-0 grid-cols-[1rem_minmax(0,1fr)] gap-x-2 rounded-md border bg-background px-2.5 py-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0">
        <span className="block truncate text-[0.7rem] text-muted-foreground leading-4">{label}</span>
        <span className="block truncate font-medium text-foreground text-xs leading-4">{value}</span>
      </span>
    </span>
  );
}

function WizardActions({
  isSaving,
  nextLabel,
  onNext,
  primaryLabel,
}: {
  isSaving: boolean;
  nextLabel?: string;
  onNext?: () => void;
  primaryLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">La sauvegarde est progressive: chaque etape ecrit cote backend.</p>
      <div className="flex justify-end gap-2">
        {nextLabel ? (
          <Button type="button" variant="outline" onClick={onNext}>
            {nextLabel}
          </Button>
        ) : null}
        <Button type="submit" disabled={isSaving}>
          {primaryLabel.startsWith("Creer") ? <Plus /> : <Save />}
          {isSaving ? "Enregistrement..." : primaryLabel}
        </Button>
      </div>
    </div>
  );
}

function DisabledHint({ enabled, text }: { enabled: boolean; text: string }) {
  if (enabled) {
    return null;
  }
  return <div className="rounded-lg border bg-muted/20 px-3 py-2 text-muted-foreground text-sm">{text}</div>;
}

function TextField({
  label,
  name,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input id={name} name={name} {...props} />
    </Field>
  );
}

function SelectField({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue: string;
  label: string;
  name: string;
  options: readonly string[];
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <NativeSelect id={name} name={name} className="w-full" defaultValue={defaultValue}>
        {options.map((option) => (
          <NativeSelectOption key={option} value={option}>
            {formatCashStatus(option)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  );
}

function contractPayload(formData: FormData, agentUserId: string): CreateCashAgentContractRequest {
  return {
    agentUserId,
    commissionMode: "percent",
    commissionValue: Number(formData.get("commissionValue") || 0),
    dailyLimitMinor: dinarToMinor(formData.get("dailyLimit")),
    monthlyLimitMinor: dinarToMinor(formData.get("monthlyLimit")),
    platformCommissionSharePercent: Number(formData.get("platformCommissionSharePercent") || 0),
    status: requiredText(formData.get("status")) as LifecycleStatus,
  };
}

function jsonRequest(method: "PATCH" | "POST", payload: unknown): RequestInit {
  return {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method,
  };
}

function requiredText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: FormDataEntryValue | null) {
  const text = requiredText(value);
  return text ? text : null;
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

function normalizeCountry(value: FormDataEntryValue | null) {
  const text = nullableText(value);
  return text ? text.toUpperCase() : null;
}

function dinarToMinor(value: FormDataEntryValue | null) {
  const text = String(value ?? "")
    .replace(",", ".")
    .trim();
  if (!text) {
    return null;
  }
  const amount = Number(text);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

function minorToDinar(value?: number | null) {
  if (value == null) {
    return "";
  }
  return String(value / 100);
}
