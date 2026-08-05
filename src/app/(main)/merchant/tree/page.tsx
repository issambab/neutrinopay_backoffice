import type { ComponentType } from "react";

import { Building2, MapPin, MonitorSmartphone, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getMerchantWorkspace } from "@/lib/merchant/merchant.server";
import { formatEnum, statusClassName } from "@/lib/merchant/merchant-format";
import type {
  BusinessResponse,
  PointOfSaleResponse,
  StationResponse,
  TerminalResponse,
} from "@/lib/organization/organization.types";
import { cn } from "@/lib/utils";

import { MerchantEmptyState } from "../_components/merchant-empty-state";

type MerchantTree = {
  business: BusinessResponse;
  pointsOfSale: PointOfSaleResponse[];
  stations: StationResponse[];
  terminalsByPointOfSaleId: Map<string, TerminalResponse[]>;
};

export default async function MerchantTreePage() {
  const { business, pointsOfSale, stations, terminals } = await getMerchantWorkspace();

  if (!business) {
    return <MerchantEmptyState text="Aucun marchand n'est rattache a ce compte." />;
  }

  const tree: MerchantTree = {
    business,
    pointsOfSale,
    stations,
    terminalsByPointOfSaleId: groupTerminalsByPointOfSale(terminals),
  };

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Arborescence commerce</h1>
          <p className="text-muted-foreground text-sm">{business.name}</p>
        </div>
        <Badge variant="outline" className={statusClassName(business.status)}>
          {formatEnum(business.status)}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Stations" value={String(stations.length)} />
        <MetricCard label="Points de vente" value={String(pointsOfSale.length)} />
        <MetricCard label="Terminaux" value={String(terminals.length)} />
      </div>

      <MerchantTreeCard tree={tree} />
    </div>
  );
}

function MerchantTreeCard({ tree }: { tree: MerchantTree }) {
  const posWithoutStation = tree.pointsOfSale.filter((pointOfSale) => !pointOfSale.stationId);
  const hasOperationalStructure = tree.stations.length > 0 || posWithoutStation.length > 0;

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TreeNodeHeader
            badge={tree.business.registrationNumber ?? tree.business.externalReference ?? undefined}
            icon={Building2}
            status={tree.business.status}
            subtitle={[formatEnum(tree.business.businessType), tree.business.city, tree.business.zone]
              .filter(Boolean)
              .join(" - ")}
            title={tree.business.name}
          />
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{tree.stations.length} stations</Badge>
            <Badge variant="secondary">{tree.pointsOfSale.length} POS</Badge>
            <Badge variant="secondary">{countTerminals(tree.terminalsByPointOfSaleId)} terminaux</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {tree.stations.map((station) => (
            <StationBranch key={station.id} station={station} tree={tree} />
          ))}

          {posWithoutStation.length > 0 && (
            <div className="grid gap-2 border-border border-l pl-4">
              <div className="text-muted-foreground text-xs">Points de vente sans station</div>
              {posWithoutStation.map((pointOfSale) => (
                <PointOfSaleBranch
                  key={pointOfSale.id}
                  pointOfSale={pointOfSale}
                  terminals={tree.terminalsByPointOfSaleId.get(pointOfSale.id) ?? []}
                />
              ))}
            </div>
          )}

          {!hasOperationalStructure && (
            <div className="rounded-md border bg-muted/20 px-3 py-4 text-center text-muted-foreground text-sm">
              Aucune structure operationnelle rattachee a votre commerce.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StationBranch({ station, tree }: { station: StationResponse; tree: MerchantTree }) {
  const stationPointsOfSale = tree.pointsOfSale.filter((pointOfSale) => pointOfSale.stationId === station.id);

  return (
    <div className="grid gap-2 border-border border-l pl-4">
      <TreeNodeHeader
        badge={station.stationCode}
        icon={MapPin}
        status={station.status}
        subtitle={[station.addressLine1, station.city, station.zone].filter(Boolean).join(" - ")}
        title={station.name}
      />
      {stationPointsOfSale.length ? (
        <div className="grid gap-2 pl-4">
          {stationPointsOfSale.map((pointOfSale) => (
            <PointOfSaleBranch
              key={pointOfSale.id}
              pointOfSale={pointOfSale}
              terminals={tree.terminalsByPointOfSaleId.get(pointOfSale.id) ?? []}
            />
          ))}
        </div>
      ) : (
        <div className="pl-4 text-muted-foreground text-sm">Aucun point de vente sur cette station.</div>
      )}
    </div>
  );
}

function PointOfSaleBranch({
  pointOfSale,
  terminals,
}: {
  pointOfSale: PointOfSaleResponse;
  terminals: TerminalResponse[];
}) {
  return (
    <div className="grid gap-2 border-border border-l pl-4">
      <TreeNodeHeader
        badge={pointOfSale.posCode}
        icon={Store}
        status={pointOfSale.status}
        subtitle={formatEnum(pointOfSale.posType)}
        title={pointOfSale.name}
      />
      {terminals.length ? (
        <div className="grid gap-2 pl-4">
          {terminals.map((terminal) => (
            <TreeNodeHeader
              compact
              icon={MonitorSmartphone}
              key={terminal.id}
              status={terminal.status}
              subtitle={[formatEnum(terminal.deviceType), terminal.serialNumber].filter(Boolean).join(" - ")}
              title={terminal.terminalCode}
            />
          ))}
        </div>
      ) : (
        <div className="pl-4 text-muted-foreground text-sm">Aucun terminal affecte.</div>
      )}
    </div>
  );
}

function TreeNodeHeader({
  badge,
  compact,
  icon: Icon,
  status,
  subtitle,
  title,
}: {
  badge?: string;
  compact?: boolean;
  icon: ComponentType<{ className?: string }>;
  status: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact ? "py-1" : "py-2")}>
      <span className="flex size-8 items-center justify-center rounded-md border bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          {badge && <Badge variant="outline">{badge}</Badge>}
          <Badge variant="outline" className={statusClassName(status)}>
            {formatEnum(status)}
          </Badge>
        </div>
        {subtitle && <div className="text-muted-foreground text-xs">{subtitle}</div>}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="grid gap-1">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="font-semibold text-2xl">{value}</span>
      </CardContent>
    </Card>
  );
}

function groupTerminalsByPointOfSale(terminals: TerminalResponse[]) {
  const terminalsByPointOfSaleId = new Map<string, TerminalResponse[]>();

  for (const terminal of terminals) {
    const group = terminalsByPointOfSaleId.get(terminal.pointOfSaleId) ?? [];
    group.push(terminal);
    terminalsByPointOfSaleId.set(terminal.pointOfSaleId, group);
  }

  return terminalsByPointOfSaleId;
}

function countTerminals(terminalsByPointOfSaleId: Map<string, TerminalResponse[]>) {
  return Array.from(terminalsByPointOfSaleId.values()).reduce((total, terminals) => total + terminals.length, 0);
}
