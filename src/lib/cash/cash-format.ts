import type { LifecycleStatus } from "./cash.types";

export function formatCashStatus(status?: string | null) {
  const labels: Record<string, string> = {
    active: "Actif",
    archived: "Archive",
    blocked: "Bloque",
    closed: "Ferme",
    draft: "Brouillon",
    pending: "En attente",
    suspended: "Suspendu",
  };

  return labels[status ?? ""] ?? status ?? "-";
}

export function cashStatusClassName(status?: LifecycleStatus | string | null) {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "suspended":
    case "blocked":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "closed":
    case "archived":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-muted bg-muted/40 text-muted-foreground";
  }
}

export function formatMinorAmount(value?: number | null, currency = "TND") {
  return new Intl.NumberFormat("fr-TN", {
    currency,
    style: "currency",
  }).format((value ?? 0) / 100);
}
