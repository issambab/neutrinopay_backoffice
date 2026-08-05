import type { KycStatus, RiskLevel } from "./kyc.types";

export const KYC_BUSINESS_REQUIRED_DOCUMENT_TYPES = [
  "business_registration",
  "tax_identifier",
  "address_proof",
  "legal_representative_id",
  "beneficial_owner_declaration",
  "bank_account_proof",
] as const;

export const KYC_CUSTOMER_REQUIRED_DOCUMENT_TYPES = [
  "cin_front",
  "cin_back",
  "selfie_verification",
  "address_proof",
] as const;

export const KYC_REQUIRED_DOCUMENT_TYPES = KYC_BUSINESS_REQUIRED_DOCUMENT_TYPES;

export const KYC_OPTIONAL_DOCUMENT_TYPES = ["activity_authorization"] as const;

export const KYC_DOCUMENT_TYPES = [...KYC_BUSINESS_REQUIRED_DOCUMENT_TYPES, ...KYC_OPTIONAL_DOCUMENT_TYPES] as const;

export const KYC_DOCUMENT_LABELS: Record<string, string> = {
  address_proof: "Justificatif adresse",
  activity_authorization: "Autorisation activite",
  bank_account_proof: "RIB / attestation bancaire",
  beneficial_owner_declaration: "Declaration beneficiaire effectif",
  business_registration: "Extrait RNE / registre commerce",
  cin_back: "CIN verso",
  cin_front: "CIN recto",
  legal_representative_id: "CIN representant legal",
  selfie_verification: "Selfie de verification",
  tax_identifier: "Identifiant fiscal",
};

export const KYC_REVIEW_STATUSES: Exclude<KycStatus, "not_started" | "pending">[] = [
  "in_review",
  "verified",
  "rejected",
  "expired",
];

export const KYC_RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "critical"];
