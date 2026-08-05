import type { PageResponse } from "@/lib/organization/organization.types";

export type { PageResponse };

export type KycStatus = "not_started" | "pending" | "in_review" | "verified" | "rejected" | "expired";
export type KycOwnerType =
  | "user"
  | "business"
  | "station"
  | "platform"
  | "fleet_company"
  | "fleet_user"
  | "cash_agent"
  | "system";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export type KycProfileResponse = {
  id: string;
  tenantId: string;
  ownerType: KycOwnerType;
  ownerId: string;
  kycLevel: string;
  status: KycStatus;
  riskLevel: RiskLevel;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type KycDocumentResponse = {
  id: string;
  tenantId: string;
  kycProfileId: string;
  documentType: string;
  storageReference: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  status: KycStatus;
  expiresAt?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type CreateMerchantKycProfileRequest = {
  initialNote?: string | null;
  kycLevel?: string | null;
  metadata?: Record<string, unknown> | null;
  riskLevel?: RiskLevel | null;
};

export type CreateCustomerKycProfileRequest = CreateMerchantKycProfileRequest;

export type CreateKycProfileRequest = CreateMerchantKycProfileRequest & {
  ownerId: string;
  ownerType: KycOwnerType;
};

export type ReviewKycProfileRequest = {
  metadata?: Record<string, unknown> | null;
  rejectionReason?: string | null;
  riskLevel?: RiskLevel | null;
  status: Exclude<KycStatus, "not_started" | "pending">;
};

export type ReviewKycDocumentRequest = {
  metadata?: Record<string, unknown> | null;
  rejectionReason?: string | null;
  status: Exclude<KycStatus, "not_started" | "pending">;
};
