import type { KycOwnerType, PageResponse, RiskLevel } from "@/lib/kyc/kyc.types";

export type { PageResponse };

export type ComplianceCaseStatus = "open" | "in_review" | "escalated" | "resolved" | "rejected" | "closed";

export type ComplianceCaseResponse = {
  id: string;
  tenantId: string;
  ownerType: KycOwnerType;
  ownerId: string;
  caseType: string;
  status: ComplianceCaseStatus;
  riskLevel: RiskLevel;
  title: string;
  description?: string | null;
  assignedTo?: string | null;
  openedAt: string;
  resolvedAt?: string | null;
  resolution?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type ComplianceEventResponse = {
  id: string;
  tenantId: string;
  complianceCaseId: string;
  actorUserId?: string | null;
  eventType: string;
  previousStatus?: ComplianceCaseStatus | null;
  newStatus?: ComplianceCaseStatus | null;
  comment?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type CreateComplianceCaseRequest = {
  assignedTo?: string | null;
  caseType: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  ownerId: string;
  ownerType: KycOwnerType;
  riskLevel?: RiskLevel | null;
  title: string;
};

export type CreateComplianceEventRequest = {
  comment?: string | null;
  eventType: string;
  metadata?: Record<string, unknown> | null;
  newStatus?: ComplianceCaseStatus | null;
};

export type UpdateComplianceCaseStatusRequest = {
  comment?: string | null;
  metadata?: Record<string, unknown> | null;
  resolution?: string | null;
  status: ComplianceCaseStatus;
};
