import { cn } from "@/lib/utils";

export function formatComplianceEnum(value?: string | null) {
  if (!value) {
    return "-";
  }

  return COMPLIANCE_LABELS[value] ?? value.replaceAll("_", " ");
}

const COMPLIANCE_LABELS: Record<string, string> = {
  business_activity_mismatch: "Activite incoherente",
  case_escalated: "Enquete escaladee",
  case_resolved: "Enquete resolue",
  customer_complaint: "Plainte client",
  customer_complaint_received: "Plainte client recue",
  external_review_request: "Demande externe",
  fraud_signal_detected: "Signal fraude detecte",
  fraud_suspicion: "Suspicion fraude",
  kyc_case_resolved: "Enquete KYC resolue",
  kyc_document_rejected: "Document KYC rejete",
  kyc_document_resubmitted: "Document KYC resoumis",
  kyc_document_review: "Revue document KYC",
  kyc_document_verified: "Document KYC valide",
  kyc_profile_rejected: "Profil KYC rejete",
  kyc_profile_review: "Revue profil KYC",
  kyc_profile_verified: "Profil KYC valide",
  manual_note: "Note interne",
  periodic_review: "Revue periodique",
  terminal_misuse: "Usage terminal suspect",
  terminal_misuse_detected: "Usage terminal suspect detecte",
};

export function formatComplianceDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function complianceStatusClassName(status?: string | null) {
  return cn(
    "px-1.5",
    status === "resolved" && "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
    (status === "open" || status === "in_review") &&
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    status === "escalated" && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    (status === "rejected" || status === "closed") && "border-muted bg-muted/40 text-muted-foreground",
  );
}

export function complianceRiskClassName(risk?: string | null) {
  return cn(
    "px-1.5",
    risk === "low" && "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
    risk === "medium" && "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    risk === "high" && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    risk === "critical" && "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
  );
}
