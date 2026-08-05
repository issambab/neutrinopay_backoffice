import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getMerchantWorkspace } from "@/lib/merchant/merchant.server";
import { formatEnum, statusClassName } from "@/lib/merchant/merchant-format";

import { MerchantEmptyState } from "../_components/merchant-empty-state";

export default async function MerchantTerminalsPage() {
  const { business, terminals } = await getMerchantWorkspace();

  if (!business) {
    return <MerchantEmptyState text="Aucun marchand n'est rattache a ce compte." />;
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Terminaux</h1>
        <p className="text-muted-foreground text-sm">{business.name}</p>
      </div>
      {terminals.length === 0 ? (
        <MerchantEmptyState text="Aucun terminal affecte a vos points de vente." />
      ) : (
        <div className="grid gap-3">
          {terminals.map((terminal) => (
            <Card key={terminal.id} size="sm">
              <CardContent>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm">{terminal.terminalCode}</span>
                      <Badge variant="outline">{formatEnum(terminal.deviceType)}</Badge>
                      <Badge variant="outline" className={statusClassName(terminal.status)}>
                        {formatEnum(terminal.status)}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {[terminal.pointOfSaleName, terminal.stationName].filter(Boolean).join(" - ") || "-"}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">{terminal.serialNumber ?? "Sans numero serie"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
