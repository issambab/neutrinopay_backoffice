import { cn } from "@/lib/utils";

export function formatKycEnum(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
}

export function kycStatusClassName(status?: string | null) {
  return cn(
    "px-1.5",
    status === "verified" && "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
    (status === "pending" || status === "in_review") &&
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    status === "rejected" && "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
    status === "expired" && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    (!status || status === "not_started") && "border-muted bg-muted/40 text-muted-foreground",
  );
}

export function formatKycDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
