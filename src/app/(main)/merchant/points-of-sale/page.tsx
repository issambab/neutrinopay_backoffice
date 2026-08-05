import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getMerchantWorkspace } from "@/lib/merchant/merchant.server";
import { formatEnum, statusClassName } from "@/lib/merchant/merchant-format";

import { MerchantEmptyState } from "../_components/merchant-empty-state";

export default async function MerchantPointsOfSalePage() {
  const { business, pointsOfSale } = await getMerchantWorkspace();

  if (!business) {
    return <MerchantEmptyState text="Aucun marchand n'est rattache a ce compte." />;
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Points de vente</h1>
        <p className="text-muted-foreground text-sm">{business.name}</p>
      </div>
      {pointsOfSale.length === 0 ? (
        <MerchantEmptyState text="Aucun point de vente rattache a votre marchand." />
      ) : (
        <div className="grid gap-3">
          {pointsOfSale.map((pointOfSale) => (
            <Card key={pointOfSale.id} size="sm">
              <CardContent>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm">{pointOfSale.name}</span>
                      <Badge variant="outline">{pointOfSale.posCode}</Badge>
                      <Badge variant="outline">{formatEnum(pointOfSale.posType)}</Badge>
                      <Badge variant="outline" className={statusClassName(pointOfSale.status)}>
                        {formatEnum(pointOfSale.status)}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-sm">{pointOfSale.stationName ?? "Sans station"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
