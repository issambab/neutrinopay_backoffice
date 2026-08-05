import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getMerchantWorkspace } from "@/lib/merchant/merchant.server";
import { formatEnum, statusClassName } from "@/lib/merchant/merchant-format";

import { MerchantEmptyState } from "../_components/merchant-empty-state";

export default async function MerchantStationsPage() {
  const { business, stations } = await getMerchantWorkspace();

  if (!business) {
    return <MerchantEmptyState text="Aucun marchand n'est rattache a ce compte." />;
  }

  return (
    <div className="grid gap-5">
      <PageTitle title="Stations" subtitle={business.name} />
      {stations.length === 0 ? (
        <MerchantEmptyState text="Aucune station rattachee a votre marchand." />
      ) : (
        <div className="grid gap-3">
          {stations.map((station) => (
            <Card key={station.id} size="sm">
              <CardContent>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm">{station.name}</span>
                      <Badge variant="outline">{station.stationCode}</Badge>
                      <Badge variant="outline" className={statusClassName(station.status)}>
                        {formatEnum(station.status)}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {[station.city, station.zone].filter(Boolean).join(" - ") || "-"}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {[station.latitude, station.longitude].filter(Boolean).join(", ")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PageTitle({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <div>
      <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{subtitle}</p>
    </div>
  );
}
