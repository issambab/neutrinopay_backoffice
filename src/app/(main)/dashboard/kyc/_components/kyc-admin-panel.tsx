"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { AlertTriangle, CheckCircle2, Clock3, Eye, FileText, FileUp, Save, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  KYC_BUSINESS_REQUIRED_DOCUMENT_TYPES,
  KYC_CUSTOMER_REQUIRED_DOCUMENT_TYPES,
  KYC_DOCUMENT_LABELS,
  KYC_REVIEW_STATUSES,
  KYC_RISK_LEVELS,
} from "@/lib/kyc/kyc.constants";
import type {
  KycDocumentResponse,
  KycProfileResponse,
  KycStatus,
  ReviewKycDocumentRequest,
  ReviewKycProfileRequest,
} from "@/lib/kyc/kyc.types";
import { formatKycDate, formatKycEnum, kycStatusClassName } from "@/lib/kyc/kyc-format";
import { cn } from "@/lib/utils";

type KycAdminPanelProps = {
  documents: KycDocumentResponse[];
  ownerId: string;
  ownerLabel: string;
  ownerType: "business" | "user";
  profile: KycProfileResponse | null;
};

type DocumentGroup = {
  documentType: string;
  documents: KycDocumentResponse[];
  latest: KycDocumentResponse | null;
};

export function KycAdminPanel({ documents, ownerId, ownerLabel, ownerType, profile }: KycAdminPanelProps) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const complianceLabel = ownerType === "business" ? "KYB" : "KYC";
  const documentTypes = useMemo(() => getDocumentTypes(ownerType), [ownerType]);
  const requiredDocumentTypes = useMemo(() => getRequiredDocumentTypes(ownerType), [ownerType]);
  const documentGroups = useMemo(() => groupDocumentsByType(documents, documentTypes), [documents, documentTypes]);
  const summary = useMemo(
    () => buildKycSummary(documentGroups, requiredDocumentTypes),
    [documentGroups, requiredDocumentTypes],
  );

  async function createProfile() {
    setIsBusy(true);
    try {
      const response = await fetch(
        "/api/kyc/profiles",
        jsonRequest("POST", {
          initialNote: `${complianceLabel} marchand demarre depuis le backoffice pour ${ownerLabel}`,
          kycLevel: "basic",
          metadata: {},
          ownerId,
          ownerType,
          riskLevel: "low",
        }),
      );
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        profile?: KycProfileResponse;
      } | null;
      if (!response.ok || !result?.profile) {
        toast.error(result?.message ?? `Impossible de demarrer le ${complianceLabel}.`);
        return;
      }
      toast.success(`Dossier ${complianceLabel} cree.`);
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) {
      toast.error(`Creez le dossier ${complianceLabel} avant l'upload.`);
      return;
    }
    setIsBusy(true);
    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const response = await fetch(`/api/kyc/profiles/${profile.id}/documents/upload`, {
        body: formData,
        method: "POST",
      });
      const result = (await response.json().catch(() => null)) as {
        document?: KycDocumentResponse;
        message?: string;
      } | null;
      if (!response.ok || !result?.document) {
        toast.error(result?.message ?? "Impossible d'uploader le document.");
        return;
      }
      toast.success(`Document ${complianceLabel} ajoute.`);
      form.reset();
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function reviewProfile(payload: ReviewKycProfileRequest) {
    if (!profile) {
      return;
    }
    await patchReview(`/api/kyc/profiles/${profile.id}/review`, payload, `Dossier ${complianceLabel} mis a jour.`);
  }

  async function reviewDocument(documentId: string, payload: ReviewKycDocumentRequest) {
    await patchReview(`/api/kyc/documents/${documentId}/review`, payload, `Document ${complianceLabel} mis a jour.`);
  }

  async function patchReview(
    endpoint: string,
    payload: ReviewKycDocumentRequest | ReviewKycProfileRequest,
    success: string,
  ) {
    setIsBusy(true);
    try {
      const response = await fetch(endpoint, jsonRequest("PATCH", payload));
      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        toast.error(result?.message ?? `Impossible de valider le ${complianceLabel}.`);
        return;
      }
      toast.success(success);
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <KycDecisionHeader
        isBusy={isBusy}
        onCreateProfile={createProfile}
        complianceLabel={complianceLabel}
        ownerLabel={ownerLabel}
        ownerType={ownerType}
        profile={profile}
        summary={summary}
      />

      {profile && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-5">
            <RequiredDocumentsReview
              groups={documentGroups}
              isBusy={isBusy}
              onReviewDocument={reviewDocument}
              ownerType={ownerType}
              requiredDocumentTypes={requiredDocumentTypes}
            />
          </div>

          <div className="grid h-fit gap-5">
            <ProfileReviewCard isBusy={isBusy} onReviewProfile={reviewProfile} profile={profile} summary={summary} />
            {ownerType === "business" && (
              <UploadDocumentCard documentTypes={documentTypes} isBusy={isBusy} onSubmit={uploadDocument} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function KycDecisionHeader({
  complianceLabel,
  isBusy,
  onCreateProfile,
  ownerLabel,
  ownerType,
  profile,
  summary,
}: {
  complianceLabel: "KYB" | "KYC";
  isBusy: boolean;
  onCreateProfile: () => void;
  ownerLabel: string;
  ownerType: "business" | "user";
  profile: KycProfileResponse | null;
  summary: ReturnType<typeof buildKycSummary>;
}) {
  const status = profile?.status ?? "not_started";
  const ownerKindLabel = ownerType === "business" ? "marchand" : "customer";

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-1">
            <CardTitle>
              Dossier {complianceLabel} {ownerKindLabel}
            </CardTitle>
            <p className="text-muted-foreground text-sm">{ownerLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={kycStatusClassName(status)}>
              {formatAdminKycStatus(status)}
            </Badge>
            {profile && (
              <Badge variant="outline" className={riskClassName(profile.riskLevel)}>
                Risque {formatKycEnum(profile.riskLevel)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        {!profile ? (
          <div className="flex flex-col gap-3 rounded-md border bg-muted/20 p-4 text-sm">
            <span className="text-muted-foreground">
              {ownerType === "business"
                ? "Aucun dossier KYB n'existe encore pour ce marchand."
                : "Dossier non demarre par le client."}
            </span>
            {ownerType === "business" && (
              <Button type="button" className="w-fit" onClick={onCreateProfile} disabled={isBusy}>
                <ShieldCheck />
                Demarrer KYB
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Documents requis valides</span>
                <span className="font-medium">
                  {summary.verifiedCount}/{summary.requiredCount}
                </span>
              </div>
              <Progress value={summary.progress} className="h-2" />
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard label="Valides" tone="success" value={summary.verifiedCount} />
              <MetricCard label="En attente" tone="info" value={summary.waitingCount} />
              <MetricCard label="A corriger" tone="danger" value={summary.rejectedCount} />
              <MetricCard label="Manquants" tone="muted" value={summary.missingCount} />
            </div>

            <DecisionNotice profile={profile} summary={summary} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DecisionNotice({
  profile,
  summary,
}: {
  profile: KycProfileResponse;
  summary: ReturnType<typeof buildKycSummary>;
}) {
  if (summary.isReadyForFinalApproval) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-green-500/20 bg-green-500/10 p-3 text-green-700 text-sm dark:text-green-300">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        <div className="grid gap-1">
          <span className="font-medium">Pret pour validation finale.</span>
          <span>Tous les documents requis ont une derniere version validee.</span>
        </div>
      </div>
    );
  }

  if (summary.rejectedCount > 0 || profile.status === "rejected") {
    return (
      <div className="flex items-start gap-3 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-red-700 text-sm dark:text-red-300">
        <XCircle className="mt-0.5 size-4 shrink-0" />
        <div className="grid gap-1">
          <span className="font-medium">Correction requise.</span>
          <span>
            Un document ou le dossier global est rejete. La raison doit etre claire pour permettre le re-upload.
          </span>
        </div>
      </div>
    );
  }

  if (summary.missingCount > 0) {
    return (
      <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-3 text-muted-foreground text-sm">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="grid gap-1">
          <span className="font-medium text-foreground">Documents manquants.</span>
          <span>
            Le dossier ne peut pas etre valide tant que les documents obligatoires Tunisie ne sont pas presents et
            verifies.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-md border border-blue-500/20 bg-blue-500/10 p-3 text-blue-700 text-sm dark:text-blue-300">
      <Clock3 className="mt-0.5 size-4 shrink-0" />
      <div className="grid gap-1">
        <span className="font-medium">Verification en cours.</span>
        <span>Traitez les documents en attente avant de prendre la decision finale.</span>
      </div>
    </div>
  );
}

function ProfileReviewCard({
  isBusy,
  onReviewProfile,
  profile,
  summary,
}: {
  isBusy: boolean;
  onReviewProfile: (payload: ReviewKycProfileRequest) => void;
  profile: KycProfileResponse;
  summary: ReturnType<typeof buildKycSummary>;
}) {
  const [status, setStatus] = useState<ReviewKycProfileRequest["status"]>(toReviewStatus(profile.status));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rejectionReason = nullableText(formData.get("rejectionReason"));

    if (status === "rejected" && !rejectionReason) {
      toast.error("La raison est obligatoire si le profil est rejete.");
      return;
    }
    if (status === "verified" && !summary.isReadyForFinalApproval) {
      toast.error("Tous les documents requis doivent etre verifies avant de valider le profil.");
      return;
    }

    onReviewProfile({
      metadata: profile.metadata ?? {},
      rejectionReason,
      riskLevel: formData.get("riskLevel") as ReviewKycProfileRequest["riskLevel"],
      status,
    });
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Decision finale</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 text-sm">
          <Info label="Niveau" value={profile.kycLevel} />
          <Info label="Soumis le" value={formatKycDate(profile.submittedAt)} />
          <Info label="Revise le" value={formatKycDate(profile.reviewedAt)} />
          <Info label="Reviewer" value={profile.reviewedBy ?? "-"} />
          <Info label="Raison" value={profile.rejectionReason ?? "-"} />
        </div>

        <form className="grid gap-3 border-t pt-4" onSubmit={submit}>
          <Field>
            <FieldLabel>Statut dossier</FieldLabel>
            <NativeSelect
              name="status"
              value={status}
              onChange={(event) => setStatus(event.currentTarget.value as ReviewKycProfileRequest["status"])}
            >
              {KYC_REVIEW_STATUSES.map((reviewStatus) => (
                <NativeSelectOption key={reviewStatus} value={reviewStatus}>
                  {formatAdminKycStatus(reviewStatus)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel>Risque</FieldLabel>
            <NativeSelect name="riskLevel" defaultValue={profile.riskLevel}>
              {KYC_RISK_LEVELS.map((risk) => (
                <NativeSelectOption key={risk} value={risk}>
                  {formatKycEnum(risk)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel>Raison</FieldLabel>
            <Textarea name="rejectionReason" placeholder="Obligatoire si rejet" rows={3} />
          </Field>
          <Button type="submit" disabled={isBusy || (status === "verified" && !summary.isReadyForFinalApproval)}>
            <Save />
            Appliquer la decision
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function UploadDocumentCard({
  documentTypes,
  isBusy,
  onSubmit,
}: {
  documentTypes: readonly string[];
  isBusy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card id="admin-kyc-upload">
      <CardHeader className="border-b">
        <CardTitle>Ajouter un document</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <Field>
            <FieldLabel>Type document</FieldLabel>
            <NativeSelect name="documentType" defaultValue="business_registration">
              {documentTypes.map((type) => (
                <NativeSelectOption key={type} value={type}>
                  {documentLabel(type)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel>Fichier</FieldLabel>
            <Input name="file" type="file" accept="application/pdf,image/jpeg,image/png" required />
          </Field>
          <Button type="submit" disabled={isBusy}>
            <FileUp />
            Uploader
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RequiredDocumentsReview({
  groups,
  isBusy,
  onReviewDocument,
  ownerType,
  requiredDocumentTypes,
}: {
  groups: DocumentGroup[];
  isBusy: boolean;
  onReviewDocument: (documentId: string, payload: ReviewKycDocumentRequest) => void;
  ownerType: "business" | "user";
  requiredDocumentTypes: readonly string[];
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          {ownerType === "business" ? "Revue documentaire marchand" : "Revue documentaire customer"}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {groups.map((group) => (
          <DocumentTypeSection
            group={group}
            isBusy={isBusy}
            key={group.documentType}
            onReviewDocument={onReviewDocument}
            requiredDocumentTypes={requiredDocumentTypes}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function DocumentTypeSection({
  group,
  isBusy,
  onReviewDocument,
  requiredDocumentTypes,
}: {
  group: DocumentGroup;
  isBusy: boolean;
  onReviewDocument: (documentId: string, payload: ReviewKycDocumentRequest) => void;
  requiredDocumentTypes: readonly string[];
}) {
  const latest = group.latest;

  return (
    <div className="grid gap-3 rounded-md border p-3">
      <div className="flex flex-col gap-2 border-b pb-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md border bg-muted/40">
            <FileText className="size-4 text-muted-foreground" />
          </span>
          <div className="grid gap-0.5">
            <span className="font-medium text-sm">{documentLabel(group.documentType)}</span>
            {!isRequiredDocumentType(group.documentType, requiredDocumentTypes) && (
              <span className="text-muted-foreground text-xs">Optionnel selon activite</span>
            )}
            <span className="text-muted-foreground text-xs">
              {group.documents.length ? `${group.documents.length} upload(s) dans l'historique` : "Document non envoye"}
            </span>
          </div>
        </div>
        <Badge variant="outline" className={kycStatusClassName(latest?.status ?? "not_started")}>
          {formatAdminKycStatus(latest?.status ?? "not_started")}
        </Badge>
      </div>

      {latest ? (
        <div className="grid gap-3">
          <DocumentVersionCard
            document={latest}
            isBusy={isBusy}
            isLatest
            onReviewDocument={onReviewDocument}
            versionLabel={`Version ${group.documents.length}`}
          />

          {group.documents.length > 1 && (
            <details className="group rounded-md border bg-muted/20">
              <summary className="cursor-pointer px-3 py-2 font-medium text-sm">
                Voir les anciennes versions ({group.documents.length - 1})
              </summary>
              <div className="grid gap-3 border-t p-3">
                {group.documents.slice(1).map((document, index) => (
                  <DocumentVersionCard
                    document={document}
                    isBusy={isBusy}
                    key={document.id}
                    onReviewDocument={onReviewDocument}
                    versionLabel={`Version ${group.documents.length - index - 1}`}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-4 text-sm">
          <span className="text-muted-foreground">Document manquant. Le profil ne pourra pas etre valide.</span>
        </div>
      )}
    </div>
  );
}

function DocumentVersionCard({
  document,
  isBusy,
  isLatest = false,
  onReviewDocument,
  versionLabel,
}: {
  document: KycDocumentResponse;
  isBusy: boolean;
  isLatest?: boolean;
  onReviewDocument: (documentId: string, payload: ReviewKycDocumentRequest) => void;
  versionLabel: string;
}) {
  const [status, setStatus] = useState<ReviewKycDocumentRequest["status"]>(toReviewStatus(document.status));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rejectionReason = nullableText(formData.get("rejectionReason"));

    if (status === "rejected" && !rejectionReason) {
      toast.error("La raison est obligatoire si le document est rejete.");
      return;
    }

    onReviewDocument(document.id, {
      metadata: {},
      rejectionReason,
      status,
    });
  }

  return (
    <div className={cn("grid gap-3 rounded-md border p-3", isLatest ? "bg-muted/20" : "bg-background")}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm">{versionLabel}</span>
            {isLatest && (
              <Badge variant="secondary" className="px-1.5">
                dernier upload
              </Badge>
            )}
            <Badge variant="outline" className={kycStatusClassName(document.status)}>
              {formatAdminKycStatus(document.status)}
            </Badge>
          </div>
          <div className="text-muted-foreground text-xs">
            {document.fileName ?? document.storageReference} - {formatFileSize(document.fileSizeBytes)}
          </div>
          <div className="text-muted-foreground text-xs">
            Upload: {formatKycDate(document.submittedAt ?? document.createdAt)}
            {document.reviewedAt ? ` - Review: ${formatKycDate(document.reviewedAt)}` : ""}
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="w-fit">
          <a href={`/api/kyc/documents/${document.id}/file`} target="_blank" rel="noreferrer">
            <Eye />
            Voir
          </a>
        </Button>
      </div>

      {document.rejectionReason && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-2 text-red-700 text-sm dark:text-red-300">
          {document.rejectionReason}
        </div>
      )}

      <form className="grid gap-3 md:grid-cols-[1fr_2fr_auto]" onSubmit={submit}>
        <Field>
          <FieldLabel>Statut document</FieldLabel>
          <NativeSelect
            name="status"
            value={status}
            onChange={(event) => setStatus(event.currentTarget.value as ReviewKycDocumentRequest["status"])}
          >
            {KYC_REVIEW_STATUSES.map((reviewStatus) => (
              <NativeSelectOption key={reviewStatus} value={reviewStatus}>
                {formatAdminKycStatus(reviewStatus)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel>Raison</FieldLabel>
          <Textarea name="rejectionReason" placeholder="Obligatoire si rejet" rows={1} />
        </Field>
        <Button type="submit" className="self-end" disabled={isBusy}>
          <Save />
          Appliquer
        </Button>
      </form>
    </div>
  );
}

function MetricCard({
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

function groupDocumentsByType(documents: KycDocumentResponse[], documentTypes: readonly string[]): DocumentGroup[] {
  const grouped = new Map<string, KycDocumentResponse[]>();

  for (const type of documentTypes) {
    grouped.set(type, []);
  }

  for (const document of documents) {
    const group = grouped.get(document.documentType) ?? [];
    group.push(document);
    grouped.set(document.documentType, group);
  }

  return Array.from(grouped.entries())
    .map(([documentType, groupDocuments]) => {
      const sortedDocuments = [...groupDocuments].sort(
        (left, right) => documentTimestamp(right) - documentTimestamp(left),
      );

      return {
        documentType,
        documents: sortedDocuments,
        latest: sortedDocuments[0] ?? null,
      };
    })
    .sort(
      (left, right) =>
        documentTypeOrder(left.documentType, documentTypes) - documentTypeOrder(right.documentType, documentTypes),
    );
}

function buildKycSummary(groups: DocumentGroup[], requiredDocumentTypes: readonly string[]) {
  const requiredDocuments = groups
    .filter((group) => isRequiredDocumentType(group.documentType, requiredDocumentTypes))
    .map((group) => group.latest);
  const latestDocuments = requiredDocuments;
  const verifiedCount = latestDocuments.filter((document) => document?.status === "verified").length;
  const rejectedCount = latestDocuments.filter(
    (document) => document?.status === "rejected" || document?.status === "expired",
  ).length;
  const waitingCount = latestDocuments.filter(
    (document) => document?.status === "pending" || document?.status === "in_review",
  ).length;
  const missingCount = latestDocuments.filter((document) => !document).length;

  return {
    isReadyForFinalApproval: missingCount === 0 && rejectedCount === 0 && waitingCount === 0,
    missingCount,
    progress: Math.round((verifiedCount / requiredDocumentTypes.length) * 100),
    rejectedCount,
    requiredCount: requiredDocumentTypes.length,
    verifiedCount,
    waitingCount,
  };
}

function documentTypeOrder(documentType: string, documentTypes: readonly string[]) {
  const index = documentTypes.indexOf(documentType);
  return index === -1 ? documentTypes.length : index;
}

function isRequiredDocumentType(documentType: string, requiredDocumentTypes: readonly string[]) {
  return requiredDocumentTypes.includes(documentType);
}

function documentTimestamp(document: KycDocumentResponse) {
  return new Date(document.submittedAt ?? document.createdAt).getTime();
}

function documentLabel(documentType: string) {
  return KYC_DOCUMENT_LABELS[documentType] ?? formatKycEnum(documentType);
}

function getDocumentTypes(ownerType: "business" | "user") {
  return ownerType === "business"
    ? [...KYC_BUSINESS_REQUIRED_DOCUMENT_TYPES, "activity_authorization"]
    : KYC_CUSTOMER_REQUIRED_DOCUMENT_TYPES;
}

function getRequiredDocumentTypes(ownerType: "business" | "user") {
  return ownerType === "business" ? KYC_BUSINESS_REQUIRED_DOCUMENT_TYPES : KYC_CUSTOMER_REQUIRED_DOCUMENT_TYPES;
}

function formatAdminKycStatus(status: KycStatus | "not_started") {
  const labels: Record<KycStatus, string> = {
    expired: "Expire",
    in_review: "En verification",
    not_started: "Non demarre",
    pending: "En attente",
    rejected: "Rejete",
    verified: "Valide",
  };

  return labels[status] ?? formatKycEnum(status);
}

function toReviewStatus(status: KycStatus): ReviewKycDocumentRequest["status"] {
  if (status === "pending" || status === "not_started") {
    return "in_review";
  }
  return status;
}

function riskClassName(risk?: string | null) {
  return cn(
    "px-1.5",
    risk === "low" && "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
    risk === "medium" && "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    risk === "high" && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    risk === "critical" && "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
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

function nullableText(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  return value.trim();
}

function formatFileSize(value?: number | null) {
  if (!value) {
    return "-";
  }
  return `${Math.round(value / 1024)} KB`;
}
