"use client";

import type { FormEvent, InputHTMLAttributes } from "react";
import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { RegenerateTerminalActivationButton } from "@/components/organization/regenerate-terminal-activation-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COMPLIANCE_CASE_TYPES, COMPLIANCE_RISK_LEVELS } from "@/lib/compliance/compliance.constants";
import type { ComplianceCaseResponse, CreateComplianceCaseRequest } from "@/lib/compliance/compliance.types";
import {
  complianceRiskClassName,
  complianceStatusClassName,
  formatComplianceDate,
  formatComplianceEnum,
} from "@/lib/compliance/compliance-format";
import type { KycDocumentResponse, KycProfileResponse } from "@/lib/kyc/kyc.types";
import { formatKycEnum, kycStatusClassName } from "@/lib/kyc/kyc-format";
import type {
  BusinessResponse,
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
import { cn } from "@/lib/utils";

import { KycAdminPanel } from "../../kyc/_components/kyc-admin-panel";

const STATUSES: LifecycleStatus[] = ["pending", "active", "suspended", "blocked", "closed"];
const CREATE_STATUSES: LifecycleStatus[] = ["pending", "active", "suspended"];
const BUSINESS_TYPES = ["merchant", "fuel_station", "retail", "restaurant", "service", "partner"];
const POS_TYPES = ["physical", "counter", "kiosk", "mobile", "online"];
const DEVICE_TYPES = ["android_pos", "qr_terminal"];
const MERCHANT_DETAIL_TABS = ["overview", "stations", "pos", "terminals", "users", "kyc", "compliance"];

type MerchantDetailProps = {
  business: BusinessResponse;
  complianceCases: ComplianceCaseResponse[];
  initialTab?: string;
  merchantUsers: MerchantUserResponse[];
  kycDocuments: KycDocumentResponse[];
  kycProfile: KycProfileResponse | null;
  pointsOfSale: PointOfSaleResponse[];
  stations: StationResponse[];
  terminals: TerminalResponse[];
};

export function MerchantDetail({
  business,
  complianceCases,
  initialTab = "overview",
  kycDocuments,
  kycProfile,
  merchantUsers,
  pointsOfSale,
  stations,
  terminals,
}: MerchantDetailProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const defaultTab = MERCHANT_DETAIL_TABS.includes(initialTab) ? initialTab : "overview";

  async function updateBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    const payload = {
      externalReference: nullableText(formData.get("externalReference")),
      name: nullableText(formData.get("name")),
      businessType: nullableText(formData.get("businessType")),
      registrationNumber: nullableText(formData.get("registrationNumber")),
      taxIdentifier: nullableText(formData.get("taxIdentifier")),
      addressLine1: nullableText(formData.get("addressLine1")),
      addressLine2: nullableText(formData.get("addressLine2")),
      contactEmail: nullableText(formData.get("contactEmail")),
      contactPhone: nullableText(formData.get("contactPhone")),
      city: nullableText(formData.get("city")),
      region: nullableText(formData.get("region")),
      countryCode: normalizeCountry(formData.get("countryCode")),
      zone: nullableText(formData.get("zone")),
      metadata: business.metadata ?? {},
    };

    try {
      const response = await fetch(`/api/organization/businesses/${business.id}`, jsonRequest("PATCH", payload));
      const result = (await response.json().catch(() => null)) as {
        business?: BusinessResponse;
        message?: string;
      } | null;
      if (!response.ok || !result?.business) {
        toast.error(result?.message ?? "Impossible de modifier le marchand.");
        return;
      }
      toast.success("Marchand modifie.");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStatus(kind: ResourceKind, id: string, status: string) {
    const endpoint = resourceEndpoint(kind, id, "status");
    const response = await fetch(endpoint, jsonRequest("PATCH", { status }));
    const result = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    if (!response.ok) {
      toast.error(result?.message ?? "Impossible de modifier le statut.");
      return;
    }
    toast.success("Statut modifie.");
    router.refresh();
  }

  async function updateResource(kind: ResourceKind, id: string, formData: FormData) {
    const payload =
      kind === "station"
        ? {
            stationCode: nullableText(formData.get("code")),
            name: nullableText(formData.get("name")),
            addressLine1: nullableText(formData.get("addressLine1")),
            addressLine2: nullableText(formData.get("addressLine2")),
            city: nullableText(formData.get("city")),
            region: nullableText(formData.get("region")),
            countryCode: normalizeCountry(formData.get("countryCode")),
            zone: nullableText(formData.get("zone")),
            latitude: nullableNumber(formData.get("latitude")),
            longitude: nullableNumber(formData.get("longitude")),
            metadata: {},
          }
        : kind === "pointOfSale"
          ? {
              posCode: nullableText(formData.get("code")),
              name: nullableText(formData.get("name")),
              posType: nullableText(formData.get("type")),
            }
          : {
              terminalCode: nullableText(formData.get("code")),
              deviceType: nullableText(formData.get("type")),
              serialNumber: nullableText(formData.get("serialNumber")),
            };
    const response = await fetch(resourceEndpoint(kind, id), jsonRequest("PATCH", payload));
    const result = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    if (!response.ok) {
      toast.error(result?.message ?? "Impossible de modifier.");
      return;
    }
    toast.success("Modification enregistree.");
    router.refresh();
  }

  async function createStation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
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
        jsonRequest("POST", payload),
      );
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        station?: StationResponse;
      } | null;
      if (!response.ok || !result?.station) {
        toast.error(result?.message ?? "Impossible d'ajouter la station.");
        return;
      }
      toast.success("Station ajoutee.");
      form.reset();
      router.refresh();
    } finally {
      setIsCreating(false);
    }
  }

  async function createPointOfSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
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
        jsonRequest("POST", payload),
      );
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        pointOfSale?: PointOfSaleResponse;
      } | null;
      if (!response.ok || !result?.pointOfSale) {
        toast.error(result?.message ?? "Impossible d'ajouter le point de vente.");
        return;
      }
      toast.success("Point de vente ajoute.");
      form.reset();
      router.refresh();
    } finally {
      setIsCreating(false);
    }
  }

  async function createTerminal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const pointOfSaleId = requiredText(formData.get("pointOfSaleId"));
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
        jsonRequest("POST", payload),
      );
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        terminal?: TerminalResponse;
      } | null;
      if (!response.ok || !result?.terminal) {
        toast.error(result?.message ?? "Impossible d'affecter le terminal.");
        return;
      }
      toast.success("Terminal affecte.");
      form.reset();
      router.refresh();
    } finally {
      setIsCreating(false);
    }
  }

  async function createMerchantUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
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
        jsonRequest("POST", payload),
      );
      const result = (await response.json().catch(() => null)) as {
        merchantUser?: MerchantUserResponse;
        message?: string;
      } | null;
      if (!response.ok || !result?.merchantUser) {
        toast.error(result?.message ?? "Impossible de creer le compte marchand.");
        return;
      }
      toast.success("Compte marchand cree.");
      form.reset();
      router.refresh();
    } finally {
      setIsCreating(false);
    }
  }

  async function createComplianceCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload: CreateComplianceCaseRequest = {
      caseType: requiredText(formData.get("caseType")),
      description: nullableText(formData.get("description")),
      metadata: {
        source: "merchant_admin_detail",
      },
      ownerId: business.id,
      ownerType: "business",
      riskLevel: formData.get("riskLevel") as CreateComplianceCaseRequest["riskLevel"],
      title: requiredText(formData.get("title")),
    };

    try {
      const response = await fetch("/api/compliance/cases", jsonRequest("POST", payload));
      const result = (await response.json().catch(() => null)) as {
        case?: ComplianceCaseResponse;
        message?: string;
      } | null;
      if (!response.ok || !result?.case) {
        toast.error(result?.message ?? "Impossible d'ouvrir l'enquete compliance.");
        return;
      }
      toast.success("Enquete compliance ouverte.");
      form.reset();
      router.refresh();
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteResource(kind: ResourceKind, id: string) {
    if (!window.confirm("Confirmer la suppression ? L'element sera soft-delete cote backend.")) {
      return;
    }
    const response = await fetch(resourceEndpoint(kind, id), {
      method: "DELETE",
    });
    const result = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    if (!response.ok) {
      toast.error(result?.message ?? "Impossible de supprimer.");
      return;
    }
    toast.success("Element supprime.");
    if (kind === "business") {
      router.push("/dashboard/merchants");
      return;
    }
    router.refresh();
  }

  return (
    <Tabs defaultValue={defaultTab} className="gap-4">
      <TabsList>
        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
        <TabsTrigger value="stations">Stations</TabsTrigger>
        <TabsTrigger value="pos">Points de vente</TabsTrigger>
        <TabsTrigger value="terminals">Terminaux</TabsTrigger>
        <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        <TabsTrigger value="kyc">KYB</TabsTrigger>
        <TabsTrigger value="compliance">Compliance</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Informations marchand</CardTitle>
              <Badge variant="outline" className={statusClassName(business.status)}>
                {formatEnum(business.status)}
              </Badge>
              <Badge
                variant="outline"
                className={kycStatusClassName(business.kycStatus ?? kycProfile?.status ?? "not_started")}
              >
                KYB {formatKycEnum(business.kycStatus ?? kycProfile?.status ?? "not_started")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateBusiness} className="grid gap-5">
              <FieldGroup className="grid gap-4 md:grid-cols-2">
                <TextField name="name" label="Nom" defaultValue={business.name} required />
                <SelectField
                  name="businessType"
                  label="Type"
                  options={BUSINESS_TYPES}
                  defaultValue={business.businessType}
                />
                <TextField
                  name="externalReference"
                  label="Reference externe"
                  defaultValue={business.externalReference ?? ""}
                />
                <TextField
                  name="registrationNumber"
                  label="Registre commerce"
                  defaultValue={business.registrationNumber ?? ""}
                />
                <TextField
                  name="taxIdentifier"
                  label="Identifiant fiscal"
                  defaultValue={business.taxIdentifier ?? ""}
                />
                <TextField name="contactEmail" label="Email contact" defaultValue={business.contactEmail ?? ""} />
                <TextField name="contactPhone" label="Telephone" defaultValue={business.contactPhone ?? ""} />
                <TextField name="addressLine1" label="Adresse" defaultValue={business.addressLine1 ?? ""} />
                <TextField name="addressLine2" label="Complement adresse" defaultValue={business.addressLine2 ?? ""} />
                <TextField name="city" label="Ville" defaultValue={business.city ?? ""} />
                <TextField name="region" label="Region" defaultValue={business.region ?? ""} />
                <TextField
                  name="countryCode"
                  label="Pays ISO"
                  defaultValue={business.countryCode ?? ""}
                  maxLength={2}
                />
                <TextField name="zone" label="Zone" defaultValue={business.zone ?? ""} />
              </FieldGroup>
              <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <StatusControl
                  value={business.status}
                  onChange={(status) => updateStatus("business", business.id, status)}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => deleteResource("business", business.id)}>
                    <Trash2 />
                    Supprimer
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    <Save />
                    {isSaving ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="stations">
        <div className="grid gap-4">
          <CreateStationCard isCreating={isCreating} onSubmit={createStation} />
          <ResourceList
            emptyText="Aucune station pour ce marchand."
            items={stations.map((station) => ({
              addressLine1: station.addressLine1 ?? "",
              addressLine2: station.addressLine2 ?? "",
              code: station.stationCode,
              city: station.city ?? "",
              countryCode: station.countryCode ?? "",
              id: station.id,
              kind: "station",
              latitude: station.latitude ?? "",
              longitude: station.longitude ?? "",
              meta:
                [station.addressLine1, station.city, station.zone].filter(Boolean).join(" - ") || station.businessName,
              name: station.name,
              region: station.region ?? "",
              status: station.status,
              zone: station.zone ?? "",
            }))}
            onDelete={deleteResource}
            onUpdate={updateResource}
            onStatusChange={updateStatus}
          />
        </div>
      </TabsContent>

      <TabsContent value="pos">
        <div className="grid gap-4">
          <CreatePointOfSaleCard isCreating={isCreating} stations={stations} onSubmit={createPointOfSale} />
          <ResourceList
            emptyText="Aucun point de vente pour ce marchand."
            items={pointsOfSale.map((pos) => ({
              code: pos.posCode,
              id: pos.id,
              kind: "pointOfSale",
              meta: [formatEnum(pos.posType), pos.stationName].filter(Boolean).join(" - "),
              name: pos.name,
              status: pos.status,
              typeValue: pos.posType,
            }))}
            onDelete={deleteResource}
            onUpdate={updateResource}
            onStatusChange={updateStatus}
          />
        </div>
      </TabsContent>

      <TabsContent value="terminals">
        <div className="grid gap-4">
          <CreateTerminalCard isCreating={isCreating} pointsOfSale={pointsOfSale} onSubmit={createTerminal} />
          <ResourceList
            emptyText="Aucun terminal affecte."
            items={terminals.map((terminal) => ({
              activationCode:
                metadataText(terminal.metadata, "activationCode") ??
                metadataText(terminal.metadata, "activation_code") ??
                "-",
              activationExpiresAt:
                metadataText(terminal.metadata, "activationCodeExpiresAt") ??
                metadataText(terminal.metadata, "activation_code_expires_at"),
              code: terminal.terminalCode,
              deviceFingerprint: metadataText(terminal.metadata, "deviceFingerprint"),
              id: terminal.id,
              kind: "terminal",
              lastSeenAt: terminal.lastSeenAt,
              meta: [formatEnum(terminal.deviceType), terminal.pointOfSaleName, terminal.serialNumber]
                .filter(Boolean)
                .join(" - "),
              name: terminal.terminalCode,
              serialNumber: terminal.serialNumber ?? "",
              status: terminal.status,
              terminalId: terminal.id,
              typeValue: terminal.deviceType,
            }))}
            onDelete={deleteResource}
            onUpdate={updateResource}
            onStatusChange={updateStatus}
          />
        </div>
      </TabsContent>

      <TabsContent value="users">
        <div className="grid gap-4">
          <CreateMerchantUserCard isCreating={isCreating} onSubmit={createMerchantUser} />
          <MerchantUsersList merchantUsers={merchantUsers} />
        </div>
      </TabsContent>

      <TabsContent value="kyc">
        <KycAdminPanel
          documents={kycDocuments}
          ownerId={business.id}
          ownerLabel={business.name}
          ownerType="business"
          profile={kycProfile}
        />
      </TabsContent>

      <TabsContent value="compliance">
        <MerchantCompliancePanel
          businessName={business.name}
          complianceCases={complianceCases}
          isCreating={isCreating}
          onSubmit={createComplianceCase}
        />
      </TabsContent>
    </Tabs>
  );
}

function MerchantCompliancePanel({
  businessName,
  complianceCases,
  isCreating,
  onSubmit,
}: {
  businessName: string;
  complianceCases: ComplianceCaseResponse[];
  isCreating: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Ouvrir une enquete compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <FieldGroup className="grid gap-4 md:grid-cols-3">
              <TextField name="title" label="Titre" defaultValue={`Enquete compliance - ${businessName}`} required />
              <Field>
                <FieldLabel htmlFor="caseType">Type enquete</FieldLabel>
                <NativeSelect id="caseType" name="caseType" defaultValue="periodic_review">
                  {COMPLIANCE_CASE_TYPES.map((caseType) => (
                    <NativeSelectOption key={caseType} value={caseType}>
                      {formatComplianceEnum(caseType)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="riskLevel">Risque</FieldLabel>
                <NativeSelect id="riskLevel" name="riskLevel" defaultValue="medium">
                  {COMPLIANCE_RISK_LEVELS.map((risk) => (
                    <NativeSelectOption key={risk} value={risk}>
                      {formatComplianceEnum(risk)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </FieldGroup>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Input id="description" name="description" placeholder="Contexte du controle ou de l'escalade" />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" disabled={isCreating}>
                <Plus />
                {isCreating ? "Ouverture..." : "Ouvrir l'enquete"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Enquetes compliance du marchand</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {complianceCases.length ? (
            complianceCases.map((complianceCase) => (
              <div
                key={complianceCase.id}
                className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{complianceCase.title}</span>
                    <Badge variant="outline" className={complianceStatusClassName(complianceCase.status)}>
                      {formatComplianceEnum(complianceCase.status)}
                    </Badge>
                    <Badge variant="outline" className={complianceRiskClassName(complianceCase.riskLevel)}>
                      Risque {formatComplianceEnum(complianceCase.riskLevel)}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {formatComplianceEnum(complianceCase.caseType)} - ouvert le{" "}
                    {formatComplianceDate(complianceCase.openedAt)}
                  </div>
                  {complianceCase.resolution && (
                    <div className="text-muted-foreground text-sm">{complianceCase.resolution}</div>
                  )}
                </div>
                <Button asChild variant="outline" size="sm" className="w-fit">
                  <Link href={`/dashboard/compliance/${complianceCase.id}`}>Ouvrir</Link>
                </Button>
              </div>
            ))
          ) : (
            <div className="rounded-md border bg-muted/20 p-4 text-center text-muted-foreground text-sm">
              Aucune enquete compliance pour ce marchand.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateMerchantUserCard({
  isCreating,
  onSubmit,
}: {
  isCreating: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Creer un compte marchand</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <FieldGroup className="grid gap-4 md:grid-cols-3">
            <TextField name="fullName" label="Nom complet" required />
            <TextField name="email" label="Email de connexion" type="email" required />
            <TextField name="temporaryPassword" label="Mot de passe temporaire" type="password" required />
            <TextField name="phoneNumber" label="Telephone" placeholder="+21600000000" />
            <TextField name="externalReference" label="Reference externe" />
          </FieldGroup>
          <div className="flex justify-end">
            <Button type="submit" disabled={isCreating}>
              <Plus />
              {isCreating ? "Creation..." : "Creer le compte"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function MerchantUsersList({ merchantUsers }: { merchantUsers: MerchantUserResponse[] }) {
  if (!merchantUsers.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          Aucun compte marchand rattache.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {merchantUsers.map(({ roleAssignment, user }) => (
        <Card key={user.id} size="sm">
          <CardContent>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="grid gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm">{user.fullName}</span>
                  <Badge variant="outline" className={statusClassName(user.status)}>
                    {formatEnum(user.status)}
                  </Badge>
                  <Badge variant="outline">{roleAssignment.roleCode}</Badge>
                </div>
                <span className="text-muted-foreground text-sm">{user.email}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-muted-foreground text-xs">
                <Badge variant="secondary">{formatEnum(user.userType)}</Badge>
                <Badge variant="secondary">{formatEnum(roleAssignment.scope)}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CreateStationCard({
  isCreating,
  onSubmit,
}: {
  isCreating: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Ajouter une station</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <FieldGroup className="grid gap-4 md:grid-cols-3">
            <TextField name="stationCode" label="Code station" required placeholder="ST-TUN-01" />
            <TextField name="name" label="Nom station" required />
            <SelectField name="status" label="Statut initial" options={CREATE_STATUSES} defaultValue="pending" />
            <TextField name="addressLine1" label="Adresse" />
            <TextField name="city" label="Ville" />
            <TextField name="region" label="Region" />
            <TextField name="countryCode" label="Pays ISO" maxLength={2} placeholder="TN" />
            <TextField name="zone" label="Zone" />
            <TextField name="latitude" label="Latitude" type="number" step="0.000001" />
            <TextField name="longitude" label="Longitude" type="number" step="0.000001" />
          </FieldGroup>
          <div className="flex justify-end">
            <Button type="submit" disabled={isCreating}>
              <Plus />
              {isCreating ? "Ajout..." : "Ajouter la station"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function CreatePointOfSaleCard({
  isCreating,
  onSubmit,
  stations,
}: {
  isCreating: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  stations: StationResponse[];
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Ajouter un point de vente</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <FieldGroup className="grid gap-4 md:grid-cols-3">
            <TextField name="posCode" label="Code point de vente" required placeholder="POS-001" />
            <TextField name="name" label="Nom point de vente" required />
            <SelectField name="posType" label="Type POS" options={POS_TYPES} defaultValue="physical" />
            <SelectField name="status" label="Statut initial" options={CREATE_STATUSES} defaultValue="pending" />
            <Field>
              <FieldLabel htmlFor="stationId">Station rattachee</FieldLabel>
              <NativeSelect id="stationId" name="stationId" className="w-full" defaultValue="">
                <NativeSelectOption value="">Sans station</NativeSelectOption>
                {stations.map((station) => (
                  <NativeSelectOption key={station.id} value={station.id}>
                    {station.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </FieldGroup>
          <div className="flex justify-end">
            <Button type="submit" disabled={isCreating}>
              <Plus />
              {isCreating ? "Ajout..." : "Ajouter le point de vente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function CreateTerminalCard({
  isCreating,
  onSubmit,
  pointsOfSale,
}: {
  isCreating: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pointsOfSale: PointOfSaleResponse[];
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Affecter un terminal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          {pointsOfSale.length === 0 && (
            <div className="rounded-lg border bg-muted/20 px-3 py-2 text-muted-foreground text-sm">
              Ajoutez au moins un point de vente avant d'affecter un terminal.
            </div>
          )}
          <FieldGroup className="grid gap-4 md:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="pointOfSaleId">Point de vente</FieldLabel>
              <NativeSelect id="pointOfSaleId" name="pointOfSaleId" className="w-full" required>
                <NativeSelectOption value="">Selectionner</NativeSelectOption>
                {pointsOfSale.map((pos) => (
                  <NativeSelectOption key={pos.id} value={pos.id}>
                    {pos.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <TextField name="terminalCode" label="Code terminal" required placeholder="TPE-001" />
            <SelectField name="deviceType" label="Type device" options={DEVICE_TYPES} defaultValue="android_pos" />
            <SelectField name="status" label="Statut initial" options={CREATE_STATUSES} defaultValue="pending" />
            <TextField name="serialNumber" label="Numero serie" />
            <TextField name="apiClientId" label="API client ID" placeholder="Optionnel" />
          </FieldGroup>
          <div className="flex justify-end">
            <Button type="submit" disabled={isCreating || pointsOfSale.length === 0}>
              <Plus />
              {isCreating ? "Affectation..." : "Affecter le terminal"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

type ResourceKind = "business" | "pointOfSale" | "station" | "terminal";

type ResourceItem = {
  addressLine1?: string;
  addressLine2?: string;
  code: string;
  city?: string;
  countryCode?: string;
  id: string;
  kind: ResourceKind;
  latitude?: number | string;
  longitude?: number | string;
  activationCode?: string;
  activationExpiresAt?: string | null;
  deviceFingerprint?: string | null;
  lastSeenAt?: string | null;
  meta: string;
  name: string;
  region?: string;
  serialNumber?: string;
  status: LifecycleStatus;
  terminalId?: string;
  typeValue?: string;
  zone?: string;
};

function ResourceList({
  emptyText,
  items,
  onDelete,
  onStatusChange,
  onUpdate,
}: {
  emptyText: string;
  items: ResourceItem[];
  onDelete: (kind: ResourceKind, id: string) => void;
  onStatusChange: (kind: ResourceKind, id: string, status: string) => void;
  onUpdate: (kind: ResourceKind, id: string, formData: FormData) => void;
}) {
  if (!items.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">{emptyText}</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card key={item.id} size="sm">
          <CardContent>
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                onUpdate(item.kind, item.id, new FormData(event.currentTarget));
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-sm">{item.name}</span>
                <Badge variant="outline">{item.code}</Badge>
                <Badge variant="outline" className={statusClassName(item.status)}>
                  {formatEnum(item.status)}
                </Badge>
              </div>
              <span className="text-muted-foreground text-sm">{item.meta || "-"}</span>
              {item.kind === "terminal" && (
                <div className="grid gap-2 rounded-md border bg-muted/10 p-3 md:grid-cols-2 xl:grid-cols-6">
                  <CompactInfo label="Activation code" value={item.activationCode ?? "-"} mono />
                  <CompactInfo label="Expiration" value={formatDateTime(item.activationExpiresAt)} />
                  <CompactInfo label="Device fingerprint" value={item.deviceFingerprint ?? "Non lie"} mono />
                  <CompactInfo label="Dernier signal" value={formatDateTime(item.lastSeenAt)} />
                  <CompactInfo label="Terminal ID" value={item.terminalId ?? item.id} mono />
                  <div className="grid content-end">
                    <RegenerateTerminalActivationButton
                      terminalCode={item.code}
                      terminalId={item.terminalId ?? item.id}
                    />
                  </div>
                </div>
              )}
              <FieldGroup className="grid gap-3 md:grid-cols-3">
                <TextField name="code" label="Code" defaultValue={item.code} required />
                <TextField name="name" label="Nom" defaultValue={item.name} required />
                {item.kind === "pointOfSale" && (
                  <SelectField
                    name="type"
                    label="Type"
                    options={POS_TYPES}
                    defaultValue={item.typeValue ?? "physical"}
                  />
                )}
                {item.kind === "terminal" && (
                  <SelectField
                    name="type"
                    label="Type"
                    options={DEVICE_TYPES}
                    defaultValue={item.typeValue ?? "android_pos"}
                  />
                )}
                {item.kind === "terminal" && (
                  <TextField name="serialNumber" label="Numero serie" defaultValue={item.serialNumber ?? ""} />
                )}
                {item.kind === "station" && (
                  <TextField name="addressLine1" label="Adresse" defaultValue={item.addressLine1 ?? ""} />
                )}
                {item.kind === "station" && (
                  <TextField name="addressLine2" label="Complement adresse" defaultValue={item.addressLine2 ?? ""} />
                )}
                {item.kind === "station" && <TextField name="city" label="Ville" defaultValue={item.city ?? ""} />}
                {item.kind === "station" && <TextField name="region" label="Region" defaultValue={item.region ?? ""} />}
                {item.kind === "station" && (
                  <TextField name="countryCode" label="Pays ISO" defaultValue={item.countryCode ?? ""} maxLength={2} />
                )}
                {item.kind === "station" && <TextField name="zone" label="Zone" defaultValue={item.zone ?? ""} />}
                {item.kind === "station" && (
                  <TextField
                    name="latitude"
                    label="Latitude"
                    type="number"
                    step="0.000001"
                    defaultValue={item.latitude ?? ""}
                  />
                )}
                {item.kind === "station" && (
                  <TextField
                    name="longitude"
                    label="Longitude"
                    type="number"
                    step="0.000001"
                    defaultValue={item.longitude ?? ""}
                  />
                )}
              </FieldGroup>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <StatusControl value={item.status} onChange={(status) => onStatusChange(item.kind, item.id, status)} />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => onDelete(item.kind, item.id)}>
                    <Trash2 />
                    Supprimer
                  </Button>
                  <Button type="submit" size="sm">
                    <Save />
                    Enregistrer
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CompactInfo({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="grid min-w-0 gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={mono ? "truncate font-mono text-xs" : "truncate font-medium text-sm"}>{value}</span>
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
      <NativeSelect id={name} name={name} className="w-full" defaultValue={defaultValue}>
        {options.map((option) => (
          <NativeSelectOption key={option} value={option}>
            {formatEnum(option)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  );
}

function StatusControl({ onChange, value }: { onChange: (status: string) => void; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <NativeSelect className="w-36" defaultValue={value} onChange={(event) => onChange(event.currentTarget.value)}>
        {STATUSES.map((status) => (
          <NativeSelectOption key={status} value={status}>
            {formatEnum(status)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

function resourceEndpoint(kind: ResourceKind, id: string, suffix?: "status") {
  const base =
    {
      business: `/api/organization/businesses/${id}`,
      pointOfSale: `/api/organization/points-of-sale/${id}`,
      station: `/api/organization/stations/${id}`,
      terminal: `/api/organization/terminals/${id}`,
    }[kind] ?? "";

  return suffix ? `${base}/${suffix}` : base;
}

function jsonRequest(method: "PATCH" | "POST", payload: unknown): RequestInit {
  return {
    method,
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
  const trimmed = requiredText(value);
  return trimmed ? trimmed : null;
}

function nullableNumber(value: FormDataEntryValue | null) {
  const text = requiredText(value);
  return text ? Number(text) : null;
}

function normalizeCountry(value: FormDataEntryValue | null) {
  const text = nullableText(value);
  return text ? text.toUpperCase() : null;
}

function metadataText(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

function statusClassName(status: string) {
  return cn(
    "px-1.5",
    status === "active" && "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
    status !== "active" && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  );
}
