"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { CalendarClock, FileText, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { KycDocumentResponse, KycProfileResponse } from "@/lib/kyc/kyc.types";
import { formatWalletEnum, walletStatusClassName } from "@/lib/wallet/wallet-format";

const REQUIRED_DOCUMENTS = [
  { label: "CIN recto", type: "cin_front" },
  { label: "CIN verso", type: "cin_back" },
  { label: "Selfie de verification", type: "selfie_verification" },
  { label: "Justificatif adresse", type: "address_proof" },
];

type UserKycPanelProps = {
  documents: KycDocumentResponse[];
  profile: KycProfileResponse | null;
};

export function UserKycPanel({ documents, profile }: UserKycPanelProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const groupedByType = useMemo(() => groupDocumentsByType(documents), [documents]);

  const createProfile = async () => {
    setCreating(true);
    const response = await fetch("/api/customer/kyc/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ kycLevel: "basic", riskLevel: "medium" }),
    });
    const result = (await response.json().catch(() => null)) as { message?: string } | null;
    setCreating(false);

    if (!response.ok) {
      toast.error(result?.message ?? "Impossible de demarrer le KYC.");
      return;
    }

    toast.success("Dossier KYC demarre.");
    router.refresh();
  };

  const uploadDocument = async (documentType: string, file?: File | null) => {
    if (!file) {
      return;
    }

    setUploadingType(documentType);
    const formData = new FormData();
    formData.set("documentType", documentType);
    formData.set("file", file);

    const response = await fetch("/api/customer/kyc/documents/upload", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json().catch(() => null)) as { message?: string } | null;
    setUploadingType(null);

    if (!response.ok) {
      toast.error(result?.message ?? "Impossible d'uploader le document.");
      return;
    }

    toast.success("Document envoye.");
    router.refresh();
  };

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>KYC user</CardTitle>
              <p className="text-muted-foreground text-sm">
                Validation requise avant activation des transactions wallet.
              </p>
            </div>
            <Badge variant="outline" className={walletStatusClassName(profile?.status ?? "pending")}>
              {formatWalletEnum(profile?.status ?? "not_started")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {profile ? (
            <div className="flex items-start gap-3 rounded-md border p-3">
              <ShieldCheck className="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Dossier cree</p>
                <p className="text-muted-foreground text-sm">Niveau {formatWalletEnum(profile.kycLevel)}</p>
                {profile.rejectionReason ? (
                  <p className="mt-1 text-destructive text-sm">Raison: {profile.rejectionReason}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-md border border-dashed p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">Dossier KYC non demarre</p>
                <p className="text-muted-foreground text-sm">Demarrez le dossier avant d'envoyer vos documents.</p>
              </div>
              <Button onClick={createProfile} disabled={creating}>
                {creating ? "Demarrage..." : "Demarrer KYC"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {REQUIRED_DOCUMENTS.map((requiredDocument) => {
          const documentHistory = groupedByType.get(requiredDocument.type) ?? [];
          const latest = documentHistory[0];
          const canUpload = Boolean(profile && (!latest || ["rejected", "expired"].includes(latest.status)));

          return (
            <Card key={requiredDocument.type}>
              <CardContent className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{requiredDocument.label}</p>
                      {latest ? (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                          <Badge variant="outline" className={walletStatusClassName(latest.status)}>
                            {formatWalletEnum(latest.status)}
                          </Badge>
                          <a
                            href={`/api/customer/kyc/documents/${latest.id}/file`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            Visualiser
                          </a>
                          {latest.rejectionReason ? (
                            <span className="text-destructive">Raison: {latest.rejectionReason}</span>
                          ) : null}
                          <span className="text-muted-foreground text-xs">{formatDate(latest.createdAt)}</span>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">Document manquant.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf,image/jpeg,image/png"
                      disabled={!canUpload || uploadingType === requiredDocument.type}
                      onChange={(event) => uploadDocument(requiredDocument.type, event.target.files?.[0])}
                    />
                    <Upload className="size-4 text-muted-foreground" />
                  </div>
                </div>
                {documentHistory.length ? (
                  <div className="grid gap-2 border-t pt-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <CalendarClock className="size-3.5" />
                      Historique des uploads
                    </div>
                    {documentHistory.map((document) => (
                      <div
                        key={document.id}
                        className="grid gap-2 rounded-md border bg-muted/15 p-3 text-sm md:grid-cols-[1fr_auto] md:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{document.fileName ?? "Document KYC"}</p>
                          <p className="text-muted-foreground text-xs">
                            Envoye le {formatDate(document.createdAt)}
                            {document.reviewedAt ? ` - revu le ${formatDate(document.reviewedAt)}` : ""}
                          </p>
                          {document.rejectionReason ? (
                            <p className="text-destructive text-xs">Raison: {document.rejectionReason}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={walletStatusClassName(document.status)}>
                            {formatWalletEnum(document.status)}
                          </Badge>
                          <a
                            href={`/api/customer/kyc/documents/${document.id}/file`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary text-sm underline-offset-4 hover:underline"
                          >
                            Visualiser
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function groupDocumentsByType(documents: KycDocumentResponse[]) {
  const byType = new Map<string, KycDocumentResponse[]>();
  for (const document of documents) {
    const current = byType.get(document.documentType) ?? [];
    current.push(document);
    byType.set(document.documentType, current);
  }

  for (const [documentType, typedDocuments] of byType.entries()) {
    byType.set(
      documentType,
      [...typedDocuments].sort(
        (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
      ),
    );
  }

  return byType;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
