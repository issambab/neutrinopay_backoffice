"use client";

import type { FormEvent, InputHTMLAttributes } from "react";
import { useMemo, useRef, useState } from "react";

import Link from "next/link";

import { CheckCircle2, Circle, Plus, Save, Store } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import type {
  BusinessResponse,
  CreateBusinessRequest,
  CreateMerchantUserRequest,
  CreatePointOfSaleRequest,
  CreateStationRequest,
  CreateTerminalRequest,
  LifecycleStatus,
  MerchantUserResponse,
  PointOfSaleResponse,
  StationResponse,
  TerminalResponse,
} from "@/lib/organization/organization.types";

const STATUSES: LifecycleStatus[] = ["pending", "active", "suspended"];
const BUSINESS_TYPES = ["merchant", "fuel_station", "restaurant"];
const POS_TYPES = ["physical"];
const DEVICE_TYPES = ["android_pos", "qr_terminal"];

export function MerchantWizard() {
  const [step, setStep] = useState(1);
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [stations, setStations] = useState<StationResponse[]>([]);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSaleResponse[]>([]);
  const [terminals, setTerminals] = useState<TerminalResponse[]>([]);
  const [merchantUsers, setMerchantUsers] = useState<MerchantUserResponse[]>(
    [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const stationFormRef = useRef<HTMLFormElement>(null);
  const posFormRef = useRef<HTMLFormElement>(null);
  const terminalFormRef = useRef<HTMLFormElement>(null);
  const merchantUserFormRef = useRef<HTMLFormElement>(null);
  const canAddOperationalChildren = Boolean(business);
  const progress = useMemo(
    () => [
      { id: 1, label: "Marchand", done: Boolean(business) },
      { id: 2, label: "Stations", done: stations.length > 0 },
      { id: 3, label: "Points de vente", done: pointsOfSale.length > 0 },
      { id: 4, label: "Terminaux", done: terminals.length > 0 },
      { id: 5, label: "Compte marchand", done: merchantUsers.length > 0 },
    ],
    [
      business,
      merchantUsers.length,
      pointsOfSale.length,
      stations.length,
      terminals.length,
    ],
  );

  async function submitBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    const payload: CreateBusinessRequest = {
      externalReference: nullableText(formData.get("externalReference")),
      name: requiredText(formData.get("name")),
      businessType: requiredText(formData.get("businessType")),
      registrationNumber: nullableText(formData.get("registrationNumber")),
      taxIdentifier: nullableText(formData.get("taxIdentifier")),
      status: requiredText(formData.get("status")) as LifecycleStatus,
      addressLine1: nullableText(formData.get("addressLine1")),
      addressLine2: nullableText(formData.get("addressLine2")),
      city: nullableText(formData.get("city")),
      region: nullableText(formData.get("region")),
      countryCode: normalizeCountry(formData.get("countryCode")),
      zone: nullableText(formData.get("zone")),
      contactEmail: nullableText(formData.get("contactEmail")),
      contactPhone: nullableText(formData.get("contactPhone")),
      metadata: {},
    };

    try {
      const response = await fetch(
        "/api/organization/businesses",
        jsonRequest(payload),
      );
      const result = (await response.json().catch(() => null)) as {
        business?: BusinessResponse;
        message?: string;
      } | null;
      if (!response.ok || !result?.business) {
        toast.error(result?.message ?? "Impossible de creer le marchand.");
        return;
      }
      setBusiness(result.business);
      setStep(2);
      toast.success("Marchand cree.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitStation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!business) {
      toast.error("Creez d'abord le marchand.");
      return;
    }
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    const payload: CreateStationRequest = {
      stationCode: requiredText(formData.get("stationCode")),
      name: requiredText(formData.get("name")),
      addressLine1: nullableText(formData.get("addressLine1")),
      addressLine2: null,
      city: nullableText(formData.get("city")),
      region: nullableText(formData.get("region")),
      countryCode: normalizeCountry(formData.get("countryCode")),
      zone: nullableText(formData.get("zone")),
      latitude: nullableNumber(formData.get("latitude")),
      longitude: nullableNumber(formData.get("longitude")),
      status: requiredText(formData.get("status")) as LifecycleStatus,
      metadata: {},
    };

    try {
      const response = await fetch(
        `/api/organization/businesses/${business.id}/stations`,
        jsonRequest(payload),
      );
      const result = (await response.json().catch(() => null)) as {
        station?: StationResponse;
        message?: string;
      } | null;
      if (!response.ok || !result?.station) {
        toast.error(result?.message ?? "Impossible de creer la station.");
        return;
      }
      const station = result.station;
      setStations((current) => [...current, station]);
      stationFormRef.current?.reset();
      toast.success("Station ajoutee.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitPointOfSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!business) {
      toast.error("Creez d'abord le marchand.");
      return;
    }
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    const payload: CreatePointOfSaleRequest = {
      stationId: nullableText(formData.get("stationId")),
      posCode: requiredText(formData.get("posCode")),
      name: requiredText(formData.get("name")),
      posType: requiredText(formData.get("posType")),
      status: requiredText(formData.get("status")) as LifecycleStatus,
      metadata: {},
    };

    try {
      const response = await fetch(
        `/api/organization/businesses/${business.id}/points-of-sale`,
        jsonRequest(payload),
      );
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        pointOfSale?: PointOfSaleResponse;
      } | null;
      if (!response.ok || !result?.pointOfSale) {
        toast.error(
          result?.message ?? "Impossible de creer le point de vente.",
        );
        return;
      }
      const pointOfSale = result.pointOfSale;
      setPointsOfSale((current) => [...current, pointOfSale]);
      posFormRef.current?.reset();
      toast.success("Point de vente ajoute.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitTerminal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const pointOfSaleId = requiredText(formData.get("pointOfSaleId"));
    if (!pointOfSaleId) {
      toast.error("Selectionnez un point de vente.");
      return;
    }
    setIsSaving(true);
    const payload: CreateTerminalRequest = {
      terminalCode: requiredText(formData.get("terminalCode")),
      deviceType: requiredText(formData.get("deviceType")),
      serialNumber: nullableText(formData.get("serialNumber")),
      status: requiredText(formData.get("status")) as LifecycleStatus,
      apiClientId: nullableText(formData.get("apiClientId")),
      metadata: {},
    };

    try {
      const response = await fetch(
        `/api/organization/points-of-sale/${pointOfSaleId}/terminals`,
        jsonRequest(payload),
      );
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        terminal?: TerminalResponse;
      } | null;
      if (!response.ok || !result?.terminal) {
        toast.error(result?.message ?? "Impossible de creer le terminal.");
        return;
      }
      const terminal = result.terminal;
      setTerminals((current) => [...current, terminal]);
      terminalFormRef.current?.reset();
      toast.success("Terminal affecte.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitMerchantUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!business) {
      toast.error("Creez d'abord le marchand.");
      return;
    }
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    const payload: CreateMerchantUserRequest = {
      externalReference: nullableText(formData.get("externalReference")),
      phoneNumber: nullableText(formData.get("phoneNumber")),
      email: requiredText(formData.get("email")),
      fullName: requiredText(formData.get("fullName")),
      temporaryPassword: requiredText(formData.get("temporaryPassword")),
      metadata: {},
    };

    try {
      const response = await fetch(
        `/api/organization/businesses/${business.id}/merchant-users`,
        jsonRequest(payload),
      );
      const result = (await response.json().catch(() => null)) as {
        merchantUser?: MerchantUserResponse;
        message?: string;
      } | null;
      if (!response.ok || !result?.merchantUser) {
        toast.error(
          result?.message ?? "Impossible de creer le compte marchand.",
        );
        return;
      }
      const merchantUser = result.merchantUser;
      setMerchantUsers((current) => [...current, merchantUser]);
      merchantUserFormRef.current?.reset();
      toast.success("Compte marchand cree.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2 md:grid-cols-5">
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
            <span
              className={
                step === item.id ? "font-medium" : "text-muted-foreground"
              }
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {business && (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3 text-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Store className="size-4 text-muted-foreground" />
            <span className="font-medium">{business.name}</span>
            <Badge variant="outline">{formatEnum(business.status)}</Badge>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/merchants/${business.id}`}>
              Ouvrir le detail
            </Link>
          </Button>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={submitBusiness} className="grid gap-5">
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <TextField
              name="name"
              label="Nom marchand"
              required
              placeholder="Station Centrale Tunis"
            />
            <SelectField
              name="businessType"
              label="Type"
              options={BUSINESS_TYPES}
              defaultValue="merchant"
            />
            <TextField name="externalReference" label="Reference externe" />
            <TextField name="registrationNumber" label="Registre commerce" />
            <TextField name="taxIdentifier" label="Identifiant fiscal" />
            <SelectField
              name="status"
              label="Statut initial"
              options={STATUSES}
              defaultValue="pending"
            />
            <TextField name="contactEmail" label="Email contact" type="email" />
            <TextField
              name="contactPhone"
              label="Telephone contact"
              placeholder="+21600000000"
            />
            <TextField name="addressLine1" label="Adresse" />
            <TextField name="addressLine2" label="Complement adresse" />
            <TextField name="city" label="Ville" />
            <TextField name="region" label="Region" />
            <TextField
              name="countryCode"
              label="Pays ISO"
              maxLength={2}
              placeholder="TN"
            />
            <TextField name="zone" label="Zone" />
          </FieldGroup>
          <WizardActions isSaving={isSaving} primaryLabel="Creer le marchand" />
        </form>
      )}

      {step === 2 && (
        <form
          ref={stationFormRef}
          onSubmit={submitStation}
          className="grid gap-5"
        >
          <DisabledHint
            enabled={canAddOperationalChildren}
            text="Creez le marchand avant d'ajouter une station."
          />
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <TextField
              name="stationCode"
              label="Code station"
              required
              placeholder="ST-TUN-01"
            />
            <TextField name="name" label="Nom station" required />
            <TextField name="addressLine1" label="Adresse" />
            <TextField name="city" label="Ville" />
            <TextField name="region" label="Region" />
            <TextField
              name="countryCode"
              label="Pays ISO"
              maxLength={2}
              placeholder="TN"
            />
            <TextField name="zone" label="Zone" />
            <SelectField
              name="status"
              label="Statut initial"
              options={STATUSES}
              defaultValue="pending"
            />
            <TextField
              name="latitude"
              label="Latitude"
              type="number"
              step="0.000001"
            />
            <TextField
              name="longitude"
              label="Longitude"
              type="number"
              step="0.000001"
            />
          </FieldGroup>
          <WizardActions
            disabled={!canAddOperationalChildren}
            isSaving={isSaving}
            primaryLabel="Ajouter la station"
            nextLabel="Passer aux points de vente"
            onNext={() => setStep(3)}
          />
          <SummaryList
            items={stations.map(
              (station) => `${station.stationCode} - ${station.name}`,
            )}
            emptyText="Aucune station ajoutee."
          />
        </form>
      )}

      {step === 3 && (
        <form
          ref={posFormRef}
          onSubmit={submitPointOfSale}
          className="grid gap-5"
        >
          <DisabledHint
            enabled={canAddOperationalChildren}
            text="Creez le marchand avant d'ajouter un point de vente."
          />
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <TextField
              name="posCode"
              label="Code point de vente"
              required
              placeholder="POS-001"
            />
            <TextField name="name" label="Nom point de vente" required />
            <SelectField
              name="posType"
              label="Type POS"
              options={POS_TYPES}
              defaultValue="physical"
            />
            <SelectField
              name="status"
              label="Statut initial"
              options={STATUSES}
              defaultValue="pending"
            />
            <Field>
              <FieldLabel htmlFor="stationId">Station rattachee</FieldLabel>
              <NativeSelect
                id="stationId"
                name="stationId"
                className="w-full"
                defaultValue=""
              >
                <NativeSelectOption value="">Sans station</NativeSelectOption>
                {stations.map((station) => (
                  <NativeSelectOption key={station.id} value={station.id}>
                    {station.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </FieldGroup>
          <WizardActions
            disabled={!canAddOperationalChildren}
            isSaving={isSaving}
            primaryLabel="Ajouter le point de vente"
            nextLabel="Passer aux terminaux"
            onNext={() => setStep(4)}
          />
          <SummaryList
            items={pointsOfSale.map(
              (pos) =>
                `${pos.posCode} - ${pos.name}${pos.stationName ? ` (${pos.stationName})` : ""}`,
            )}
            emptyText="Aucun point de vente ajoute."
          />
        </form>
      )}

      {step === 4 && (
        <form
          ref={terminalFormRef}
          onSubmit={submitTerminal}
          className="grid gap-5"
        >
          <DisabledHint
            enabled={pointsOfSale.length > 0}
            text="Ajoutez au moins un point de vente avant d'affecter un terminal."
          />
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="pointOfSaleId">Point de vente</FieldLabel>
              <NativeSelect
                id="pointOfSaleId"
                name="pointOfSaleId"
                className="w-full"
                required
              >
                <NativeSelectOption value="">Selectionner</NativeSelectOption>
                {pointsOfSale.map((pos) => (
                  <NativeSelectOption key={pos.id} value={pos.id}>
                    {pos.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <TextField
              name="terminalCode"
              label="Code terminal"
              required
              placeholder="TPE-001"
            />
            <SelectField
              name="deviceType"
              label="Type device"
              options={DEVICE_TYPES}
              defaultValue="android_pos"
            />
            <SelectField
              name="status"
              label="Statut initial"
              options={STATUSES}
              defaultValue="pending"
            />
            <TextField name="serialNumber" label="Numero serie" />
            <TextField
              name="apiClientId"
              label="API client ID"
              placeholder="Optionnel"
            />
          </FieldGroup>
          <WizardActions
            disabled={pointsOfSale.length === 0}
            isSaving={isSaving}
            primaryLabel="Affecter le terminal"
            nextLabel={business ? "Passer au compte marchand" : undefined}
            onNext={business ? () => setStep(5) : undefined}
          />
          <SummaryList
            items={terminals.map(
              (terminal) =>
                `${terminal.terminalCode} - ${terminal.pointOfSaleName}`,
            )}
            emptyText="Aucun terminal affecte."
          />
        </form>
      )}

      {step === 5 && (
        <form
          ref={merchantUserFormRef}
          onSubmit={submitMerchantUser}
          className="grid gap-5"
        >
          <DisabledHint
            enabled={canAddOperationalChildren}
            text="Creez le marchand avant d'ajouter un compte."
          />
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <TextField name="fullName" label="Nom complet" required />
            <TextField
              name="email"
              label="Email de connexion"
              type="email"
              required
            />
            <TextField
              name="temporaryPassword"
              label="Mot de passe temporaire"
              type="password"
              required
            />
            <TextField
              name="phoneNumber"
              label="Telephone"
              placeholder="+21600000000"
            />
            <TextField name="externalReference" label="Reference externe" />
          </FieldGroup>
          <WizardActions
            disabled={!canAddOperationalChildren}
            isSaving={isSaving}
            primaryLabel="Creer le compte marchand"
            nextLabel={business ? "Terminer" : undefined}
            onNext={
              business
                ? () =>
                    window.location.assign(
                      `/dashboard/merchants/${business.id}`,
                    )
                : undefined
            }
          />
          <SummaryList
            items={merchantUsers.map(
              (merchantUser) =>
                `${merchantUser.user.fullName} - ${merchantUser.user.email}`,
            )}
            emptyText="Aucun compte marchand ajoute."
          />
        </form>
      )}
    </div>
  );
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
      <NativeSelect
        id={name}
        name={name}
        className="w-full"
        defaultValue={defaultValue}
      >
        {options.map((option) => (
          <NativeSelectOption key={option} value={option}>
            {formatEnum(option)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  );
}

function WizardActions({
  disabled,
  isSaving,
  nextLabel,
  onNext,
  primaryLabel,
}: {
  disabled?: boolean;
  isSaving: boolean;
  nextLabel?: string;
  onNext?: () => void;
  primaryLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">
        La sauvegarde est progressive: chaque etape cree les donnees cote
        backend.
      </p>
      <div className="flex justify-end gap-2">
        {nextLabel && (
          <Button type="button" variant="outline" onClick={onNext}>
            {nextLabel}
          </Button>
        )}
        <Button type="submit" disabled={(disabled ?? false) || isSaving}>
          {primaryLabel.startsWith("Creer") ? <Save /> : <Plus />}
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

  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2 text-muted-foreground text-sm">
      {text}
    </div>
  );
}

function SummaryList({
  emptyText,
  items,
}: {
  emptyText: string;
  items: string[];
}) {
  return (
    <div className="grid gap-2">
      <Separator />
      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{emptyText}</p>
      )}
    </div>
  );
}

function jsonRequest(payload: unknown): RequestInit {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };
}

function requiredText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: FormDataEntryValue | null) {
  const text = requiredText(value);
  return text ? text : null;
}

function nullableNumber(value: FormDataEntryValue | null) {
  const text = requiredText(value);
  return text ? Number(text) : null;
}

function normalizeCountry(value: FormDataEntryValue | null) {
  const text = nullableText(value);
  return text ? text.toUpperCase() : null;
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}
