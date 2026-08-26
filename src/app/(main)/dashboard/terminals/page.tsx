import type { ComponentType } from "react";

import Link from "next/link";

import { Building2, MonitorSmartphone, Store } from "lucide-react";

import { RegenerateTerminalActivationButton } from "@/components/organization/regenerate-terminal-activation-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listTerminals } from "@/lib/organization/organization.server";
import type { TerminalResponse } from "@/lib/organization/organization.types";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = ["", "pending", "active", "suspended", "blocked", "closed"];

type AdminTerminalsPageProps = {
  searchParams?: Promise<{
    page?: string;
    size?: string;
    status?: string;
  }>;
};

export default async function AdminTerminalsPage({ searchParams }: AdminTerminalsPageProps) {
  const params = await searchParams;
  const page = toPageNumber(params?.page);
  const pageSize = toPageSize(params?.size);
  const status = toStatus(params?.status);

  try {
    const terminals = await listTerminals({ page, size: pageSize, status, sort: "createdAt,desc" });
    const activeTerminals = terminals.content.filter((terminal) => terminal.status === "active").length;
    const activatedTerminals = terminals.content.filter((terminal) =>
      hasText(metadataText(terminal, "deviceFingerprint")),
    ).length;
    const missingActivationCodes = terminals.content.filter((terminal) => !hasText(activationCode(terminal))).length;

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Terminaux POS</h1>
            <p className="text-muted-foreground text-sm">
              Vue admin des terminaux, leur marchand, leur point de vente et leur code d'activation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <Button key={option || "all"} asChild size="sm" variant={status === option ? "default" : "outline"}>
                <Link href={terminalListHref({ page: 0, size: pageSize, status: option })}>
                  {option ? formatEnum(option) : "Tous"}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard icon={MonitorSmartphone} label="Terminaux sur page" value={terminals.content.length.toString()} />
          <MetricCard icon={Store} label="Actifs sur page" value={activeTerminals.toString()} />
          <MetricCard icon={Building2} label="Configures app POS" value={activatedTerminals.toString()} />
          <MetricCard icon={MonitorSmartphone} label="Sans code activation" value={missingActivationCodes.toString()} />
        </div>

        {terminals.empty ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              Aucun terminal trouve pour ce filtre.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {terminals.content.map((terminal) => (
              <AdminTerminalCard key={terminal.id} terminal={terminal} />
            ))}
          </div>
        )}

        <PaginationControls
          page={terminals.page}
          pageSize={terminals.size}
          status={status}
          totalPages={terminals.totalPages}
        />
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Terminaux POS</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger les terminaux.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acces indisponible</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Le backend organization ne repond pas."}
          </CardContent>
        </Card>
      </div>
    );
  }
}

function AdminTerminalCard({ terminal }: { terminal: TerminalResponse }) {
  const code = activationCode(terminal);
  const activationExpiresAt =
    metadataText(terminal, "activationCodeExpiresAt") ?? metadataText(terminal, "activation_code_expires_at");
  const activatedAt = metadataText(terminal, "activatedAt");
  const deviceFingerprint = metadataText(terminal, "deviceFingerprint");
  const merchantHref = `/dashboard/merchants/${terminal.businessId}?tab=terminals`;
  const posHref = `/dashboard/merchants/${terminal.businessId}?tab=pos`;

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
              {[terminal.businessName, terminal.pointOfSaleName, terminal.stationName].filter(Boolean).join(" - ")}
            </p>
          </div>
          <div className="grid gap-2 text-left lg:justify-items-end lg:text-right">
            <div className="grid gap-1">
              <span className="text-muted-foreground text-xs">Code activation</span>
              <code className="rounded-md border bg-muted/25 px-2 py-1 font-semibold text-sm">{code}</code>
            </div>
            <RegenerateTerminalActivationButton terminalCode={terminal.terminalCode} terminalId={terminal.id} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Info label="Marchand" value={terminal.businessName} href={merchantHref} />
          <Info label="Point de vente" value={terminal.pointOfSaleName} href={posHref} />
          <Info label="Station" value={terminal.stationName ?? "Sans station"} />
          <Info label="Terminal code" value={terminal.terminalCode} mono />
          <Info label="Activation code" value={code} mono />
          <Info label="Expiration activation" value={formatDateTime(activationExpiresAt)} />
          <Info label="Device fingerprint" value={deviceFingerprint ?? "Non lie"} mono />
          <Info label="Active le" value={formatDateTime(activatedAt)} />
          <Info label="Dernier signal" value={formatDateTime(terminal.lastSeenAt)} />
          <Info label="Numero serie" value={terminal.serialNumber ?? "-"} mono />
          <Info label="Device type" value={formatEnum(terminal.deviceType)} />
          <Info label="Terminal ID" value={terminal.id} mono />
        </div>
      </CardContent>
    </Card>
  );
}

function Info({ href, label, mono = false, value }: { href?: string; label: string; mono?: boolean; value: string }) {
  const content = <span className={mono ? "truncate font-mono text-xs" : "truncate font-medium text-sm"}>{value}</span>;

  return (
    <div className="grid min-w-0 gap-1 rounded-md border bg-background p-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      {href ? (
        <Link className="truncate font-medium text-primary text-sm hover:underline" href={href}>
          {value}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="font-semibold text-2xl">{value}</p>
        </div>
        <Icon className="size-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function PaginationControls({
  page,
  pageSize,
  status,
  totalPages,
}: {
  page: number;
  pageSize: number;
  status: string;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">
        Page {page + 1} / {totalPages}
      </p>
      <div className="flex justify-end gap-2">
        <Button asChild disabled={page <= 0} variant="outline">
          <Link href={terminalListHref({ page: Math.max(page - 1, 0), size: pageSize, status })}>Precedent</Link>
        </Button>
        <Button asChild disabled={page >= totalPages - 1} variant="outline">
          <Link href={terminalListHref({ page: Math.min(page + 1, totalPages - 1), size: pageSize, status })}>
            Suivant
          </Link>
        </Button>
      </div>
    </div>
  );
}

function activationCode(terminal: TerminalResponse) {
  return metadataText(terminal, "activationCode") ?? metadataText(terminal, "activation_code") ?? "-";
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

function hasText(value: string | null) {
  return Boolean(value && value.trim().length > 0 && value !== "-");
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

function statusClassName(status: string) {
  if (status === "active") {
    return "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300";
  }
  if (status === "blocked" || status === "closed") {
    return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300";
  }
  return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

function formatEnum(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
}

function terminalListHref({ page, size, status }: { page: number; size: number; status: string }) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) {
    params.set("status", status);
  }
  return `/dashboard/terminals?${params.toString()}`;
}

function toPageNumber(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function toPageSize(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : PAGE_SIZE;
}

function toStatus(value?: string) {
  return value && STATUS_OPTIONS.includes(value) ? value : "";
}
