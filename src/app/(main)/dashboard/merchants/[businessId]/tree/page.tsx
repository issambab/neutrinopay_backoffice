import type { ComponentType } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, Building2, MapPin, MonitorSmartphone, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getBusiness,
  listBusinessPointsOfSale,
  listBusinessStations,
  listPointOfSaleTerminals,
} from "@/lib/organization/organization.server";
import type {
  BusinessResponse,
  PointOfSaleResponse,
  StationResponse,
  TerminalResponse,
} from "@/lib/organization/organization.types";
import { cn } from "@/lib/utils";

type MerchantTreePageProps = {
  params: Promise<{
    businessId: string;
  }>;
};

type MerchantTree = {
  business: BusinessResponse;
  pointsOfSale: PointOfSaleResponse[];
  stations: StationResponse[];
  terminalsByPointOfSaleId: Map<string, TerminalResponse[]>;
};

export default async function MerchantScopedTreePage({ params }: MerchantTreePageProps) {
  const { businessId } = await params;

  try {
    const tree = await loadMerchantTree(businessId);

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Arborescence {tree.business.name}</h1>
            <p className="text-muted-foreground text-sm">
              Vue hierarchique du marchand, ses stations, points de vente et terminaux.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/merchants">
                <ArrowLeft />
                Retour
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/dashboard/merchants/${tree.business.id}`}>Ouvrir detail</Link>
            </Button>
          </div>
        </div>

        <MerchantTreeCard tree={tree} />
      </div>
    );
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("not found")) {
      notFound();
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Arborescence indisponible</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Impossible de charger l'arborescence du marchand."}
        </CardContent>
      </Card>
    );
  }
}

async function loadMerchantTree(businessId: string): Promise<MerchantTree> {
  const [business, stations, pointsOfSale] = await Promise.all([
    getBusiness(businessId),
    listBusinessStations(businessId, { size: 100, sort: "name,asc" }),
    listBusinessPointsOfSale(businessId, { size: 100, sort: "name,asc" }),
  ]);
  const terminalPages = await Promise.all(
    pointsOfSale.content.map((pointOfSale) => listPointOfSaleTerminals(pointOfSale.id, { size: 100 })),
  );
  const terminalsByPointOfSaleId = new Map<string, TerminalResponse[]>();

  pointsOfSale.content.forEach((pointOfSale, index) => {
    terminalsByPointOfSaleId.set(pointOfSale.id, terminalPages[index]?.content ?? []);
  });

  return {
    business,
    pointsOfSale: pointsOfSale.content,
    stations: stations.content,
    terminalsByPointOfSaleId,
  };
}

function MerchantTreeCard({ tree }: { tree: MerchantTree }) {
  const posWithoutStation = tree.pointsOfSale.filter((pointOfSale) => !pointOfSale.stationId);
  const terminalCount = Array.from(tree.terminalsByPointOfSaleId.values()).reduce(
    (total, terminals) => total + terminals.length,
    0,
  );

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TreeNodeHeader
            icon={Building2}
            title={tree.business.name}
            subtitle={[formatEnum(tree.business.businessType), tree.business.city, tree.business.zone]
              .filter(Boolean)
              .join(" - ")}
            badge={tree.business.registrationNumber ?? tree.business.externalReference ?? undefined}
            status={tree.business.status}
          />
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{tree.stations.length} stations</Badge>
            <Badge variant="secondary">{tree.pointsOfSale.length} POS</Badge>
            <Badge variant="secondary">{terminalCount} terminaux</Badge>
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
          {!tree.stations.length && !posWithoutStation.length && (
            <div className="rounded-md border bg-muted/20 px-3 py-4 text-center text-muted-foreground text-sm">
              Aucun element operationnel rattache.
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
        icon={MapPin}
        title={station.name}
        subtitle={[station.addressLine1, station.city, station.zone].filter(Boolean).join(" - ")}
        badge={station.stationCode}
        status={station.status}
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
        icon={Store}
        title={pointOfSale.name}
        subtitle={formatEnum(pointOfSale.posType)}
        badge={pointOfSale.posCode}
        status={pointOfSale.status}
      />
      {terminals.length ? (
        <div className="grid gap-2 pl-4">
          {terminals.map((terminal) => (
            <TreeNodeHeader
              key={terminal.id}
              icon={MonitorSmartphone}
              title={terminal.terminalCode}
              subtitle={[formatEnum(terminal.deviceType), terminal.serialNumber].filter(Boolean).join(" - ")}
              status={terminal.status}
              compact
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

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

function statusClassName(status: string) {
  return cn(
    "px-1.5",
    status === "active" && "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
    status !== "active" && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  );
}
