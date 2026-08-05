import { cn } from "@/lib/utils";

export function formatEnum(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
}

export function statusClassName(status?: string | null) {
  return cn(
    "capitalize",
    status === "active" && "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
    status !== "active" && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  );
}
