"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { MessageSquarePlus, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { COMPLIANCE_CASE_STATUSES, COMPLIANCE_EVENT_TYPES } from "@/lib/compliance/compliance.constants";
import type {
  ComplianceCaseResponse,
  ComplianceEventResponse,
  CreateComplianceEventRequest,
  UpdateComplianceCaseStatusRequest,
} from "@/lib/compliance/compliance.types";
import {
  complianceRiskClassName,
  complianceStatusClassName,
  formatComplianceDate,
  formatComplianceEnum,
} from "@/lib/compliance/compliance-format";

type ComplianceCaseDetailProps = {
  complianceCase: ComplianceCaseResponse;
  timeline: ComplianceEventResponse[];
};

export function ComplianceCaseDetail({ complianceCase, timeline }: ComplianceCaseDetailProps) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function updateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload: UpdateComplianceCaseStatusRequest = {
      comment: nullableText(formData.get("comment")),
      metadata: {
        source: "compliance_admin_detail",
      },
      resolution: nullableText(formData.get("resolution")),
      status: formData.get("status") as UpdateComplianceCaseStatusRequest["status"],
    };

    await patch(`/api/compliance/cases/${complianceCase.id}/status`, "PATCH", payload, "Statut Compliance mis a jour.");
  }

  async function addEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload: CreateComplianceEventRequest = {
      comment: nullableText(formData.get("comment")),
      eventType: requiredText(formData.get("eventType"), "manual_note"),
      metadata: {
        source: "compliance_admin_detail",
      },
    };

    await patch(`/api/compliance/cases/${complianceCase.id}/events`, "POST", payload, "Evenement Compliance ajoute.");
    form.reset();
  }

  async function patch(endpoint: string, method: "PATCH" | "POST", payload: unknown, successMessage: string) {
    setIsBusy(true);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        toast.error(result?.message ?? "Action Compliance impossible.");
        return;
      }

      toast.success(successMessage);
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-4">
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle>{complianceCase.title}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={complianceRiskClassName(complianceCase.riskLevel)}>
                  Risque {formatComplianceEnum(complianceCase.riskLevel)}
                </Badge>
                <Badge variant="outline" className={complianceStatusClassName(complianceCase.status)}>
                  {formatComplianceEnum(complianceCase.status)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 text-sm md:grid-cols-3">
              <Info label="Type" value={formatComplianceEnum(complianceCase.caseType)} />
              <Info
                label="Proprietaire"
                value={`${formatComplianceEnum(complianceCase.ownerType)} - ${complianceCase.ownerId}`}
              />
              <Info label="Assigne a" value={complianceCase.assignedTo ?? "-"} />
              <Info label="Ouvert le" value={formatComplianceDate(complianceCase.openedAt)} />
              <Info label="Resolu le" value={formatComplianceDate(complianceCase.resolvedAt)} />
              <Info label="Resolution" value={complianceCase.resolution ?? "-"} />
            </div>
            {complianceCase.ownerType === "business" && (
              <Button asChild variant="outline" className="w-fit">
                <Link href={`/dashboard/merchants/${complianceCase.ownerId}?tab=compliance`}>Ouvrir marchand</Link>
              </Button>
            )}
            {complianceCase.description && (
              <div className="rounded-md border bg-muted/20 p-3 text-sm">{complianceCase.description}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {timeline.length ? (
                timeline.map((item) => (
                  <div key={item.id} className="grid gap-2 rounded-md border p-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="font-medium text-sm">{formatComplianceEnum(item.eventType)}</div>
                      <div className="text-muted-foreground text-xs">{formatComplianceDate(item.createdAt)}</div>
                    </div>
                    {(item.previousStatus || item.newStatus) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {item.previousStatus && (
                          <Badge variant="outline" className={complianceStatusClassName(item.previousStatus)}>
                            {formatComplianceEnum(item.previousStatus)}
                          </Badge>
                        )}
                        {item.newStatus && (
                          <Badge variant="outline" className={complianceStatusClassName(item.newStatus)}>
                            {formatComplianceEnum(item.newStatus)}
                          </Badge>
                        )}
                      </div>
                    )}
                    {item.comment && <div className="text-sm">{item.comment}</div>}
                    {item.actorUserId && (
                      <div className="text-muted-foreground text-xs">Acteur: {item.actorUserId}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-md border bg-muted/20 p-4 text-center text-muted-foreground text-sm">
                  Aucun evenement Compliance.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid h-fit gap-4">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Changer le statut</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={updateStatus}>
              <Field>
                <FieldLabel>Statut</FieldLabel>
                <NativeSelect name="status" defaultValue={complianceCase.status}>
                  {COMPLIANCE_CASE_STATUSES.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {formatComplianceEnum(status)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel>Resolution</FieldLabel>
                <Textarea name="resolution" placeholder="Obligatoire pour resolved, rejected ou closed" rows={3} />
              </Field>
              <Field>
                <FieldLabel>Commentaire</FieldLabel>
                <Textarea name="comment" placeholder="Contexte de la decision" rows={3} />
              </Field>
              <Button type="submit" disabled={isBusy}>
                <Save />
                Enregistrer
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Ajouter un evenement</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={addEvent}>
              <Field>
                <FieldLabel>Type evenement</FieldLabel>
                <NativeSelect name="eventType" defaultValue="manual_note">
                  {COMPLIANCE_EVENT_TYPES.map((eventType) => (
                    <NativeSelectOption key={eventType} value={eventType}>
                      {formatComplianceEnum(eventType)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel>Commentaire</FieldLabel>
                <Textarea name="comment" placeholder="Note interne Compliance" rows={4} />
              </Field>
              <Button type="submit" disabled={isBusy}>
                <MessageSquarePlus />
                Ajouter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
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

function nullableText(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  return value.trim();
}

function requiredText(value: FormDataEntryValue | null, fallback: string) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }
  return value.trim();
}
