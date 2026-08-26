"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { TerminalResponse } from "@/lib/organization/organization.types";

type RegenerateTerminalActivationButtonProps = {
  terminalCode: string;
  terminalId: string;
};

export function RegenerateTerminalActivationButton({
  terminalCode,
  terminalId,
}: RegenerateTerminalActivationButtonProps) {
  const router = useRouter();
  const [isRegenerating, setIsRegenerating] = useState(false);

  async function regenerateActivationCode() {
    const confirmed = window.confirm(
      `Regenerer le code d'activation du terminal ${terminalCode} ? L'ancienne liaison app POS sera retiree et le terminal devra etre reactive.`,
    );

    if (!confirmed) {
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await fetch(`/api/organization/terminals/${terminalId}/activation-code/regenerate`, {
        method: "POST",
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        terminal?: TerminalResponse;
      } | null;

      if (!response.ok || !result?.terminal) {
        toast.error(result?.message ?? "Impossible de regenerer le code d'activation.");
        return;
      }

      const activationCode = metadataText(result.terminal.metadata, "activationCode") ?? "nouveau code genere";
      toast.success(`Code activation regenere: ${activationCode}`);
      router.refresh();
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={regenerateActivationCode} disabled={isRegenerating}>
      <RotateCcw />
      {isRegenerating ? "Regeneration..." : "Regenerer code activation"}
    </Button>
  );
}

function metadataText(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}
