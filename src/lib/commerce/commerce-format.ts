import type { LifecycleStatus } from "./commerce.types";

export function formatCommerceStatus(status?: string | null) {
  const labels: Record<string, string> = {
    active: "Actif",
    archived: "Archive",
    blocked: "Bloque",
    closed: "Ferme",
    draft: "Brouillon",
    pending: "En preparation",
    suspended: "Suspendu",
  };

  return labels[status ?? ""] ?? String(status ?? "-");
}

export function commerceStatusClassName(status?: LifecycleStatus | string | null) {
  if (status === "active") {
    return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300";
  }

  if (status === "pending" || status === "draft") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300";
  }

  if (status === "suspended" || status === "blocked") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  if (status === "closed" || status === "archived") {
    return "border-muted bg-muted/40 text-muted-foreground";
  }

  return "border-muted bg-muted/30 text-muted-foreground";
}

export function formatOrderStatus(status?: string | null) {
  const labels: Record<string, string> = {
    cancelled: "Annulee",
    confirmed: "Confirmee",
    draft: "Brouillon",
    fulfilled: "Livree",
    pending: "En attente",
    preparing: "En preparation",
    ready: "Prete",
  };

  return labels[status ?? ""] ?? String(status ?? "-");
}

export function orderStatusClassName(status?: string | null) {
  if (status === "pending") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300";
  }

  if (status === "confirmed") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (status === "preparing") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  if (status === "ready") {
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300";
  }

  if (status === "fulfilled") {
    return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300";
  }

  if (status === "cancelled") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  return "border-muted bg-muted/30 text-muted-foreground";
}

export function formatPaymentStatus(status?: string | null) {
  const labels: Record<string, string> = {
    failed: "Echec",
    paid: "Paye",
    pending: "En cours",
    refunded: "Rembourse",
    unpaid: "Non paye",
  };

  return labels[status ?? ""] ?? String(status ?? "-");
}

export function formatPaymentIntentStatus(status?: string | null) {
  const labels: Record<string, string> = {
    cancelled: "Annule",
    created: "Cree",
    failed: "Echec",
    paid: "Paye",
    pending: "En attente",
    refunded: "Rembourse",
  };

  return labels[status ?? ""] ?? String(status ?? "-");
}

export function paymentStatusClassName(status?: string | null) {
  if (status === "paid") {
    return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300";
  }

  if (status === "pending") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300";
  }

  if (status === "failed") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  if (status === "refunded") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  return "border-muted bg-muted/30 text-muted-foreground";
}

export function paymentIntentStatusClassName(status?: string | null) {
  if (status === "paid") {
    return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300";
  }

  if (status === "created" || status === "pending") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300";
  }

  if (status === "failed" || status === "cancelled") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  if (status === "refunded") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  return "border-muted bg-muted/30 text-muted-foreground";
}

export function formatMoney(amount: number | string, currency = "TND") {
  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount)) {
    return `${amount} ${currency}`;
  }

  return new Intl.NumberFormat("fr-TN", {
    currency,
    maximumFractionDigits: 3,
    style: "currency",
  }).format(numericAmount);
}

export function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} o`;
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 102.4) / 10} Ko`;
  }

  return `${Math.round(value / 1024 / 102.4) / 10} Mo`;
}
