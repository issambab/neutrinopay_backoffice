import { BadgeCheck, ShieldAlert, SquareTerminal, TrendingDown, TrendingUp, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricCards() {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <WalletCards className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Volume wallet traite</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">284.6M</div>
            <Badge>
              <TrendingUp className="size-3" />
              +18.4%
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">MAD sur les 30 derniers jours</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <BadgeCheck className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>KYC approuves</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">8,742</div>
            <Badge>
              <TrendingUp className="size-3" />
              +9.8%
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Customers et marchands combines</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <SquareTerminal className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Terminaux actifs</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">438</div>
            <Badge>
              <TrendingUp className="size-3" />
              +6.2%
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Parc POS connecte en production</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <ShieldAlert className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Alertes a traiter</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">27</div>
            <Badge variant="destructive">
              <TrendingDown className="size-3" />
              -11.5%
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Risque compliance en baisse</p>
        </CardContent>
      </Card>
    </div>
  );
}
