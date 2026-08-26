import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMerchantWorkspace } from "@/lib/merchant/merchant.server";
import { formatEnum, statusClassName } from "@/lib/merchant/merchant-format";
import type { TerminalResponse } from "@/lib/organization/organization.types";

import { MerchantEmptyState } from "../_components/merchant-empty-state";

export default async function MerchantTerminalsPage() {
  const { business, terminals } = await getMerchantWorkspace();

  if (!business) {
    return <MerchantEmptyState text="Aucun marchand n'est rattache a ce compte." />;
  }

  const activeTerminals = terminals.filter((terminal) => terminal.status === "active").length;
  const activatedTerminals = terminals.filter((terminal) =>
    hasText(metadataText(terminal, "deviceFingerprint")),
  ).length;

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Terminaux POS</h1>
          <p className="text-muted-foreground text-sm">{business.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{terminals.length} terminaux</Badge>
          <Badge variant="outline">{activeTerminals} actifs</Badge>
          <Badge variant="outline">{activatedTerminals} actives app POS</Badge>
        </div>
      </div>

      {terminals.length === 0 ? (
        <MerchantEmptyState text="Aucun terminal affecte a vos points de vente." />
      ) : (
        <div className="grid gap-4">
          {terminals.map((terminal) => (
            <TerminalCard key={terminal.id} terminal={terminal} />
          ))}
        </div>
      )}
    </div>
  );
}

function TerminalCard({ terminal }: { terminal: TerminalResponse }) {
  const activationCode = metadataText(terminal, "activationCode") ?? metadataText(terminal, "activation_code") ?? "-";
  const activationExpiresAt =
    metadataText(terminal, "activationCodeExpiresAt") ?? metadataText(terminal, "activation_code_expires_at");
  const activatedAt = metadataText(terminal, "activatedAt");
  const deviceFingerprint = metadataText(terminal, "deviceFingerprint");
  const qrPayments = metadataFlag(terminal, "qrPayments", true);
  const walletPayments = metadataFlag(terminal, "walletPayments", true);
  const refunds = metadataFlag(terminal, "refunds", true);
  const manualAmount = metadataFlag(terminal, "manualAmount", true);
  const catalog = metadataFlag(terminal, "catalog", true);

  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{terminal.terminalCode}</CardTitle>
              <Badge variant="outline">{formatEnum(terminal.deviceType)}</Badge>
              <Badge variant="outline" className={statusClassName(terminal.status)}>
                {formatEnum(terminal.status)}
              </Badge>
              <Badge
                variant="outline"
                className={deviceFingerprint ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}
              >
                {deviceFingerprint ? "Configure app POS" : "Activation disponible"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {[terminal.pointOfSaleName, terminal.stationName].filter(Boolean).join(" - ") || "Sans point de vente"}
            </p>
          </div>
          <div className="grid gap-1 text-left lg:text-right">
            <span className="text-muted-foreground text-xs">Code activation</span>
            <code className="rounded-md border bg-muted/25 px-2 py-1 font-semibold text-sm">{activationCode}</code>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Info label="Terminal code" value={terminal.terminalCode} mono />
          <Info label="Activation code" value={activationCode} mono />
          <Info label="Expiration activation" value={formatDateTime(activationExpiresAt)} />
          <Info label="Statut" value={formatEnum(terminal.status)} />
          <Info label="Point de vente" value={terminal.pointOfSaleName} />
          <Info label="Station" value={terminal.stationName ?? "Sans station"} />
          <Info label="Numero serie" value={terminal.serialNumber ?? "-"} mono />
          <Info label="Device type" value={formatEnum(terminal.deviceType)} />
          <Info label="Device fingerprint" value={deviceFingerprint ?? "Non lie"} mono />
          <Info label="Active le" value={formatDateTime(activatedAt)} />
          <Info label="Dernier signal" value={formatDateTime(terminal.lastSeenAt)} />
          <Info label="Terminal ID" value={terminal.id} mono />
        </div>

        <div className="grid gap-2 rounded-md border bg-muted/10 p-3">
          <span className="font-medium text-sm">Capacites POS</span>
          <div className="flex flex-wrap gap-2">
            <FeatureBadge enabled={qrPayments} label="QR" />
            <FeatureBadge enabled={walletPayments} label="Wallet" />
            <FeatureBadge enabled={manualAmount} label="Montant manuel" />
            <FeatureBadge enabled={catalog} label="Catalogue" />
            <FeatureBadge enabled={refunds} label="Remboursement" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Info({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="grid min-w-0 gap-1 rounded-md border bg-background p-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={mono ? "truncate font-mono text-xs" : "truncate font-medium text-sm"}>{value}</span>
    </div>
  );
}

function FeatureBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "text-muted-foreground"}
    >
      {label}: {enabled ? "ON" : "OFF"}
    </Badge>
  );
}

function metadataText(terminal: TerminalResponse, key: string) {
  const value = terminal.metadata?.[key];
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

function metadataFlag(terminal: TerminalResponse, key: string, fallback: boolean) {
  const value = terminal.metadata?.[key];
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim().toLowerCase() === "true";
  }
  return fallback;
}

function hasText(value: string | null) {
  return Boolean(value && value.trim().length > 0);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
