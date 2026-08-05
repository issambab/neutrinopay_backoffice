import type { RiskLevel } from "@/lib/kyc/kyc.types";

import type { ComplianceCaseStatus } from "./compliance.types";

export const COMPLIANCE_CASE_STATUSES: ComplianceCaseStatus[] = [
  "open",
  "in_review",
  "escalated",
  "resolved",
  "rejected",
  "closed",
];

export const COMPLIANCE_RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "critical"];

export const ACTIVE_COMPLIANCE_CASE_STATUSES: ComplianceCaseStatus[] = ["open", "in_review", "escalated"];

export const KYC_COMPLIANCE_CASE_TYPE = "kyc_document_review";
export const KYC_PROFILE_COMPLIANCE_CASE_TYPE = "kyc_profile_review";

export const COMPLIANCE_CASE_TYPES = [
  KYC_COMPLIANCE_CASE_TYPE,
  KYC_PROFILE_COMPLIANCE_CASE_TYPE,
  "fraud_suspicion",
  "customer_complaint",
  "terminal_misuse",
  "business_activity_mismatch",
  "periodic_review",
  "external_review_request",
] as const;

export const COMPLIANCE_EVENT_TYPES = [
  "manual_note",
  "kyc_document_rejected",
  "kyc_document_resubmitted",
  "kyc_document_verified",
  "kyc_profile_rejected",
  "kyc_profile_verified",
  "kyc_case_resolved",
  "fraud_signal_detected",
  "customer_complaint_received",
  "terminal_misuse_detected",
  "case_escalated",
  "case_resolved",
] as const;
