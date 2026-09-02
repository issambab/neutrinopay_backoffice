"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { AlertCircle, CheckCircle2, Clock, Eye, FileText, FileUp, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { KYC_DOCUMENT_LABELS, KYC_DOCUMENT_TYPES, KYC_REQUIRED_DOCUMENT_TYPES } from "@/lib/kyc/kyc.constants";
import type { KycDocumentResponse, KycProfileResponse, KycStatus } from "@/lib/kyc/kyc.types";
import { formatKycDate, formatKycEnum, kycStatusClassName } from "@/lib/kyc/kyc-format";
import type { BusinessResponse } from "@/lib/organization/organization.types";
import { cn } from "@/lib/utils";

type MerchantKycPanelProps = {
  business: BusinessResponse;
  documents: KycDocumentResponse[];
  profile: KycProfileResponse | null;
};

export function MerchantKycPanel({ business, documents, profile }: MerchantKycPanelProps) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const documentsByType = useMemo(() => {
    const entries = new Map<string, KycDocumentResponse>();
    for (const document of sortDocumentsByNewest(documents)) {
      if (!entries.has(document.documentType)) {
        entries.set(document.documentType, document);
      }
    }
    return entries;
  }, [documents]);
  const visibleTimeline = useMemo(() => buildPublicTimeline(profile, documents), [documents, profile]);
  const verifiedCount = KYC_REQUIRED_DOCUMENT_TYPES.filter(
    (type) => documentsByType.get(type)?.status === "verified",
  ).length;
  const rejectedCount = KYC_REQUIRED_DOCUMENT_TYPES.filter(
    (type) => documentsByType.get(type)?.status === "rejected",
  ).length;
  const waitingCount = KYC_REQUIRED_DOCUMENT_TYPES.filter((type) => {
    const status = documentsByType.get(type)?.status;
    return status === "pending" || status === "in_review";
  }).length;
  const requiredDocumentsByType = new Set(KYC_REQUIRED_DOCUMENT_TYPES.filter((type) => documentsByType.has(type)));
  const missingCount = KYC_REQUIRED_DOCUMENT_TYPES.length - requiredDocumentsByType.size;
  const progressValue = Math.round((verifiedCount / KYC_REQUIRED_DOCUMENT_TYPES.length) * 100);
  const publicStatus = profile?.status ?? business.kycStatus ?? "not_started";

  async function createProfile() {
    setIsBusy(true);
    try {
      const response = await fetch(
        "/api/merchant/kyc/profile",
        jsonRequest("POST", {
          kycLevel: "basic",
          riskLevel: "low",
          initialNote: "KYB demarre depuis le portail marchand",
          metadata: {},
        }),
      );
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        profile?: KycProfileResponse;
      } | null;
      if (!response.ok || !result?.profile) {
        toast.error(result?.message ?? "Impossible de demarrer le KYB.");
        return;
      }
      toast.success("Dossier KYB demarre.");
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const response = await fetch("/api/merchant/kyc/documents/upload", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => null)) as {
        document?: KycDocumentResponse;
        message?: string;
      } | null;
      if (!response.ok || !result?.document) {
        toast.error(result?.message ?? "Impossible d'uploader le document.");
        return;
      }
      toast.success("Document envoye.");
      form.reset();
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">KYB marchand</h1>
          <p className="text-muted-foreground text-sm">{business.name}</p>
        </div>
        <Badge variant="outline" className={kycStatusClassName(publicStatus)}>
          {formatMerchantKycStatus(publicStatus)}
        </Badge>
      </div>

      {!profile ? (
        <Card>
          <CardHeader>
            <CardTitle>Demarrer votre verification</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              Creez votre dossier KYB pour envoyer les documents de verification de votre activite.
            </p>
            <Button className="w-fit" onClick={createProfile} disabled={isBusy}>
              <ShieldCheck />
              Demarrer KYB
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Suivi de verification</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Documents verifies</span>
                  <span className="font-medium">
                    {verifiedCount}/{KYC_REQUIRED_DOCUMENT_TYPES.length}
                  </span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <ComplianceMetric label="Valides" tone="success" value={verifiedCount} />
                <ComplianceMetric label="En verification" tone="info" value={waitingCount} />
                <ComplianceMetric label="A corriger" tone="danger" value={rejectedCount} />
                <ComplianceMetric label="Manquants" tone="muted" value={missingCount} />
              </div>

              <ActionMessage
                profile={profile}
                rejectedCount={rejectedCount}
                missingCount={missingCount}
                waitingCount={waitingCount}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Documents Tunisie</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {KYC_DOCUMENT_TYPES.map((type) => {
                const document = documentsByType.get(type);
                return (
                  <div key={type} className="grid gap-3 rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{KYC_DOCUMENT_LABELS[type] ?? formatKycEnum(type)}</span>
                        {!isRequiredDocumentType(type) && (
                          <span className="text-muted-foreground text-xs">Optionnel</span>
                        )}
                      </div>
                      <Badge variant="outline" className={kycStatusClassName(document?.status ?? "not_started")}>
                        {formatMerchantKycStatus(document?.status ?? "not_started")}
                      </Badge>
                    </div>
                    <div className="grid gap-1 text-sm">
                      <Info label="Dernier fichier" value={document?.fileName ?? "Non envoye"} />
                      <Info label="Envoye le" value={formatKycDate(document?.submittedAt ?? document?.createdAt)} />
                      <Info label="Revise le" value={formatKycDate(document?.reviewedAt)} />
                    </div>
                    {document?.rejectionReason && (
                      <div className="rounded-md border border-red-500/20 bg-red-500/10 p-2 text-red-700 text-sm dark:text-red-300">
                        {document.rejectionReason}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {document && (
                        <Button asChild variant="outline" size="sm">
                          <a href={`/api/merchant/kyc/documents/${document.id}/file`} target="_blank" rel="noreferrer">
                            <Eye />
                            Voir
                          </a>
                        </Button>
                      )}
                      {(!document || document.status === "rejected" || document.status === "expired") && (
                        <Button asChild size="sm">
                          <a href="#merchant-kyc-upload">{document ? "Remplacer" : "Envoyer"}</a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Historique visible</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {visibleTimeline.length ? (
                visibleTimeline.map((item) => (
                  <div className="grid gap-1 rounded-md border p-3" key={item.id}>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-2">
                        <TimelineIcon status={item.status} />
                        <span className="font-medium text-sm">{item.title}</span>
                      </div>
                      <Badge variant="outline" className={kycStatusClassName(item.status)}>
                        {formatMerchantKycStatus(item.status)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                    {item.rejectionReason && (
                      <div className="rounded-md border border-red-500/20 bg-red-500/10 p-2 text-red-700 text-sm dark:text-red-300">
                        {item.rejectionReason}
                      </div>
                    )}
                    <span className="text-muted-foreground text-xs">{formatKycDate(item.date)}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
                  Aucun evenement visible pour le moment.
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="merchant-kyc-upload">
            <CardHeader className="border-b">
              <CardTitle>Envoyer un document</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={uploadDocument}>
                <Field>
                  <FieldLabel>Type document</FieldLabel>
                  <NativeSelect name="documentType" defaultValue="business_registration">
                    {KYC_DOCUMENT_TYPES.map((type) => (
                      <NativeSelectOption key={type} value={type}>
                        {KYC_DOCUMENT_LABELS[type] ?? formatKycEnum(type)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel>Fichier</FieldLabel>
                  <Input name="file" type="file" accept="application/pdf,image/jpeg,image/png" required />
                </Field>
                <Button type="submit" className="self-end" disabled={isBusy}>
                  <FileUp />
                  Envoyer
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ActionMessage({
  missingCount,
  profile,
  rejectedCount,
  waitingCount,
}: {
  missingCount: number;
  profile: KycProfileResponse;
  rejectedCount: number;
  waitingCount: number;
}) {
  if (rejectedCount > 0 || profile.status === "rejected") {
    return (
      <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-red-700 text-sm dark:text-red-300">
        Correction demandee. Remplacez les documents rejetes pour relancer la verification.
        {profile.rejectionReason ? ` ${profile.rejectionReason}` : ""}
      </div>
    );
  }

  if (missingCount > 0) {
    return (
      <div className="rounded-md border bg-muted/30 p-3 text-muted-foreground text-sm">
        Documents manquants. Envoyez tous les documents demandes pour permettre la validation du dossier.
      </div>
    );
  }

  if (waitingCount > 0 || profile.status === "pending" || profile.status === "in_review") {
    return (
      <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-3 text-blue-700 text-sm dark:text-blue-300">
        Votre dossier est en cours de verification. Aucune action supplementaire n'est requise pour le moment.
      </div>
    );
  }

  if (profile.status === "verified") {
    return (
      <div className="rounded-md border border-green-500/20 bg-green-500/10 p-3 text-green-700 text-sm dark:text-green-300">
        Votre dossier est valide.
      </div>
    );
  }

  return null;
}

function ComplianceMetric({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "danger" | "info" | "muted" | "success";
  value: number;
}) {
  return (
    <div
      className={cn(
        "grid gap-1 rounded-md border p-3",
        tone === "success" && "border-green-500/20 bg-green-500/10",
        tone === "info" && "border-blue-500/20 bg-blue-500/10",
        tone === "danger" && "border-red-500/20 bg-red-500/10",
        tone === "muted" && "bg-muted/30",
      )}
    >
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-semibold text-2xl">{value}</span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function TimelineIcon({ status }: { status: KycStatus }) {
  if (status === "verified") {
    return <CheckCircle2 className="size-4 text-green-600 dark:text-green-300" />;
  }

  if (status === "rejected" || status === "expired") {
    return <AlertCircle className="size-4 text-red-600 dark:text-red-300" />;
  }

  if (status === "pending" || status === "in_review") {
    return <Clock className="size-4 text-blue-600 dark:text-blue-300" />;
  }

  return <ShieldCheck className="size-4 text-muted-foreground" />;
}

function buildPublicTimeline(profile: KycProfileResponse | null, documents: KycDocumentResponse[]) {
  const events: {
    date: string;
    description: string;
    id: string;
    rejectionReason?: string | null;
    status: KycStatus;
    title: string;
  }[] = [];

  if (profile) {
    events.push({
      date: profile.createdAt,
      description: "Dossier de verification cree depuis le portail marchand.",
      id: `profile-created-${profile.id}`,
      status: profile.status,
      title: "Dossier KYB demarre",
    });

    if (profile.reviewedAt) {
      events.push({
        date: profile.reviewedAt,
        description: "Decision globale appliquee sur votre dossier KYB.",
        id: `profile-reviewed-${profile.id}`,
        rejectionReason: profile.rejectionReason,
        status: profile.status,
        title: "Dossier KYB revise",
      });
    }
  }

  for (const document of documents) {
    events.push({
      date: document.submittedAt ?? document.createdAt,
      description: `${KYC_DOCUMENT_LABELS[document.documentType] ?? formatKycEnum(document.documentType)} - ${
        document.fileName ?? "fichier envoye"
      }`,
      id: `document-submitted-${document.id}`,
      status: "pending",
      title: "Document envoye",
    });

    if (document.reviewedAt) {
      events.push({
        date: document.reviewedAt,
        description: `${KYC_DOCUMENT_LABELS[document.documentType] ?? formatKycEnum(document.documentType)} - decision de revue.`,
        id: `document-reviewed-${document.id}`,
        rejectionReason: document.rejectionReason,
        status: document.status,
        title: document.status === "rejected" ? "Correction demandee" : "Document revise",
      });
    }
  }

  return events.sort((left, right) => dateMs(right.date) - dateMs(left.date));
}

function sortDocumentsByNewest(documents: KycDocumentResponse[]) {
  return [...documents].sort((left, right) => dateMs(right.createdAt) - dateMs(left.createdAt));
}

function dateMs(value?: string | null) {
  return value ? new Date(value).getTime() : 0;
}

function isRequiredDocumentType(documentType: string) {
  return KYC_REQUIRED_DOCUMENT_TYPES.includes(documentType as (typeof KYC_REQUIRED_DOCUMENT_TYPES)[number]);
}

function formatMerchantKycStatus(status: KycStatus | "not_started") {
  const labels: Record<KycStatus, string> = {
    expired: "Expire",
    in_review: "En verification",
    not_started: "A demarrer",
    pending: "Envoye",
    rejected: "Correction demandee",
    verified: "Valide",
  };

  return labels[status] ?? formatKycEnum(status);
}

function jsonRequest(method: "POST", payload: unknown): RequestInit {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };
}
