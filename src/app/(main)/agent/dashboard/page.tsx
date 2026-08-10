import type { ComponentType } from "react";

import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
  Landmark,
  LockKeyhole,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAgentProfile } from "@/lib/cash/cash.server";
import { cashStatusClassName, formatCashStatus, formatMinorAmount } from "@/lib/cash/cash-format";

export default async function AgentDashboardPage() {
  try {
    const profile = await getCurrentAgentProfile();

    return (
      <div className="grid gap-6">
        <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <div className="flex flex-col gap-4 border-b bg-muted/25 px-5 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
            <div>
              <p className="font-medium text-muted-foreground text-sm">Agence affectee</p>
              <h1 className="font-semibold text-2xl tracking-tight">{profile.agencyName}</h1>
              <p className="text-muted-foreground text-sm">{profile.agencyCode}</p>
            </div>
            <Badge className={cashStatusClassName(profile.status)} variant="outline">
              Contrat {formatCashStatus(profile.status)}
            </Badge>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:p-5">
            <Card className="border bg-background shadow-none">
              <CardHeader className="border-b">
                <CardTitle>Position agent</CardTitle>
                <CardDescription>Votre poste operationnel pour les operations cash en agence.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <InfoBlock label="Agent" value={profile.agentName ?? profile.agentEmail ?? "Agent cash"} />
                <InfoBlock label="Email" value={profile.agentEmail ?? "-"} />
                <InfoBlock label="Telephone" value={profile.agentPhoneNumber ?? "-"} />
              </CardContent>
            </Card>

            <Card className="border bg-background shadow-none">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <LockKeyhole className="size-5" />
                  Actions cash
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button disabled className="justify-start" variant="secondary">
                  <ArrowDownToLine className="size-4" />
                  Cash-in client
                </Button>
                <Button disabled className="justify-start" variant="outline">
                  <ArrowUpFromLine className="size-4" />
                  Cash-out avec OTP
                </Button>
                <p className="text-muted-foreground text-xs">
                  Les actions seront activees apres livraison du workflow operation cash.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard icon={Landmark} label="Agence" value={profile.agencyName} />
          <MetricCard icon={WalletCards} label="Plafond jour" value={formatMinorAmount(profile.dailyLimitMinor)} />
          <MetricCard icon={CalendarClock} label="Plafond mois" value={formatMinorAmount(profile.monthlyLimitMinor)} />
          <MetricCard icon={AlertCircle} label="Commission" value={String(profile.commissionValue)} />
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Operations recentes</CardTitle>
            <CardDescription>Historique cash-in/cash-out de l'agent.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">
              Aucune operation cash disponible dans cette phase.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="grid gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Dashboard agent cash</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger votre affectation agence.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Affectation indisponible</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Aucun contrat agent cash actif n'est disponible."}
          </CardContent>
        </Card>
      </div>
    );
  }
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 truncate font-medium text-sm">{value}</p>
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
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="truncate font-semibold text-xl">{value}</p>
        </div>
        <Icon className="size-5 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
