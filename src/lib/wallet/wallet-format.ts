import { cn } from "@/lib/utils";

export function formatWalletEnum(value?: string | null) {
  if (!value) {
    return "-";
  }

  return value.replaceAll("_", " ");
}

export function walletStatusClassName(status?: string | null) {
  return cn(
    status === "active" && "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
    status === "suspended" && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    status === "blocked" && "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
    status !== "active" &&
      status !== "suspended" &&
      status !== "blocked" &&
      "border-muted-foreground/20 bg-muted text-muted-foreground",
  );
}

export function formatMinorMoney(amountMinor: number, currency = "TND") {
  return new Intl.NumberFormat("fr-TN", {
    currency,
    maximumFractionDigits: 3,
    minimumFractionDigits: 3,
    style: "currency",
  }).format(amountMinor / 1000);
}
