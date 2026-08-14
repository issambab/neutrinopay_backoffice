import type { ComponentType } from "react";

import Link from "next/link";

import {
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  HandCoins,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCurrentAgentEarningsBalance,
  getCurrentAgentFloatBalance,
  getCurrentAgentProfile,
  listCurrentAgentCashOperations,
} from "@/lib/cash/cash.server";
import type { CashOperationResponse } from "@/lib/cash/cash.types";
import {
  cashStatusClassName,
  formatCashOperationType,
  formatCashStatus,
  formatMinorAmount,
} from "@/lib/cash/cash-format";

export default async function AgentDashboardPage() {
  try {
    const [profile, floatBalance, earningsBalance, recentOperations] = await Promise.all([
      getCurrentAgentProfile(),
      getCurrentAgentFloatBalance(),
      getCurrentAgentEarningsBalance(),
      listCurrentAgentCashOperations({ page: 0, size: 6, sort: "createdAt,desc" }),
    ]);
    const postedCount = recentOperations.content.filter((operation) => operation.status === "posted").length;
    const pendingCount = recentOperations.content.filter((operation) =>
      ["otp_pending", "prepared"].includes(operation.status),
    ).length;

    return (
      <div className="grid gap-6">
        <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <div className="grid gap-5 border-b bg-muted/20 p-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:p-6">
            <div className="flex min-w-0 flex-col justify-between gap-5">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                    Caisse agent
                  </Badge>
                  <Badge className={cashStatusClassName(profile.status)} variant="outline">
                    Contrat {formatCashStatus(profile.status)}
                  </Badge>
                </div>
                <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">{profile.agencyName}</h1>
                <p className="mt-1 text-muted-foreground text-sm">
                  {profile.agencyCode} - {profile.agentName ?? profile.agentEmail ?? "Agent cash"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InfoBlock label="Agent" value={profile.agentName ?? profile.agentEmail ?? "Agent cash"} />
                <InfoBlock label="Email" value={profile.agentEmail ?? "-"} />
                <InfoBlock label="Telephone" value={profile.agentPhoneNumber ?? "-"} />
              </div>
            </div>

            <div className="rounded-lg border bg-background p-4 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-sm">Float disponible</p>
                  <p className="mt-1 font-semibold text-3xl tracking-tight">
                    {formatMinorAmount(floatBalance.availableBalanceMinor, floatBalance.currency)}
                  </p>
                </div>
                <div className="flex size-11 items-center justify-center rounded-full border bg-emerald-50 text-emerald-700">
                  <CircleDollarSign className="size-5" />
                </div>
              </div>
              <div className="mt-4 grid gap-2 border-t pt-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Asset ledger</span>
                  <span className="font-medium">{floatBalance.asset}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="shrink-0 text-muted-foreground">Compte</span>
                  <span className="break-all text-right font-mono">{floatBalance.accountAddress}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-4 lg:p-5">
            <div className="grid content-start gap-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  icon={WalletCards}
                  label="Plafond jour"
                  value={formatMinorAmount(profile.dailyLimitMinor)}
                  helper="Controle contrat"
                />
                <MetricCard
                  icon={CalendarClock}
                  label="Plafond mois"
                  value={formatMinorAmount(profile.monthlyLimitMinor)}
                  helper="Controle contrat"
                />
                <MetricCard
                  icon={AlertCircle}
                  label="Commission contrat"
                  value={`${profile.commissionValue}%`}
                  helper={`Plateforme ${profile.platformCommissionSharePercent}%`}
                />
                <MetricCard
                  icon={ReceiptText}
                  label="Operations page"
                  value={String(recentOperations.totalElements)}
                  helper="Historique agent"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatusBlock
                  icon={CheckCircle2}
                  label="Postees recentes"
                  value={postedCount.toString()}
                  helper="Mouvements deja confirmes dans Formance"
                />
                <StatusBlock
                  icon={Clock3}
                  label="En cours"
                  value={pendingCount.toString()}
                  helper="OTP ou preparation a finaliser"
                />
                <StatusBlock
                  icon={ShieldCheck}
                  label="Eligibilite caisse"
                  value={formatCashStatus(profile.status)}
                  helper="Agence et contrat agent"
                />
                <StatusBlock
                  icon={HandCoins}
                  label="Earnings agent"
                  value={formatMinorAmount(earningsBalance.balanceMinor, earningsBalance.currency)}
                  helper={earningsBalance.accountAddress}
                />
              </div>
            </div>
          </div>
        </section>

        <Card id="operations" className="scroll-mt-6">
          <CardHeader className="flex flex-col gap-3 border-b md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="size-5" />
                Operations recentes
              </CardTitle>
              <CardDescription>Les derniers Cash-in/Cash-out rattaches a votre caisse.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full md:w-fit">
              <Link href="/agent/operations">
                Voir l'historique
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RecentOperationsList operations={recentOperations.content} />
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

function RecentOperationsList({ operations }: { operations: CashOperationResponse[] }) {
  if (operations.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">
        Aucune operation cash rattachee a cet agent pour le moment.
      </div>
    );
  }

  return (
    <div className="divide-y rounded-md border">
      {operations.map((operation) => (
        <div
          key={operation.id}
          className="grid gap-3 p-3 md:grid-cols-[9rem_minmax(0,1fr)_15rem_8rem_2rem] md:items-center"
        >
          <div className="flex items-center gap-2">
            <Badge variant="outline">{formatCashOperationType(operation.operationType)}</Badge>
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">{operation.customerName ?? operation.customerUserId}</p>
            <p className="truncate text-muted-foreground text-xs">
              {operation.ledgerTransactionId ? `Ledger ${operation.ledgerTransactionId}` : operation.id}
            </p>
          </div>
          <OperationAmountSummary operation={operation} />
          <Badge className={cashStatusClassName(operation.status)} variant="outline">
            {formatCashStatus(operation.status)}
          </Badge>
          <Button asChild variant="ghost" size="icon" className="hidden size-8 md:inline-flex">
            <Link href={`/agent/operations?page=0&size=20&sort=createdAt,desc`}>
              <span className="sr-only">Ouvrir l'historique agent</span>
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}

function OperationAmountSummary({ operation }: { operation: CashOperationResponse }) {
  const breakdown = cashBreakdown(operation);

  if (operation.operationType === "cash_in") {
    return (
      <div className="grid gap-1 text-sm md:text-right">
        <span className="font-semibold">{formatMinorAmount(breakdown.customerNetMinor, operation.currency)}</span>
        <span className="text-muted-foreground text-xs">
          Brut recu {formatMinorAmount(breakdown.grossMinor, operation.currency)}
        </span>
        <span className="text-muted-foreground text-xs">
          Commission {formatMinorAmount(breakdown.commissionMinor, operation.currency)} · Agent{" "}
          {formatMinorAmount(breakdown.agentCommissionMinor, operation.currency)}
        </span>
      </div>
    );
  }

  return (
    <div className="grid gap-1 text-sm md:text-right">
      <span className="font-semibold">{formatMinorAmount(operation.amountMinor, operation.currency)}</span>
      <span className="text-muted-foreground text-xs">Montant remis au client</span>
      {breakdown.commissionMinor > 0 ? (
        <span className="text-muted-foreground text-xs">
          Commission {formatMinorAmount(breakdown.commissionMinor, operation.currency)}
        </span>
      ) : null}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/70 p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 truncate font-medium text-sm">{value}</p>
    </div>
  );
}

function cashBreakdown(operation: CashOperationResponse) {
  const grossMinor = operation.grossAmountMinor ?? operation.amountMinor;
  const customerNetMinor = operation.customerNetAmountMinor ?? operation.amountMinor;
  const commissionMinor = operation.commissionAmountMinor ?? Math.max(grossMinor - customerNetMinor, 0);
  const agentCommissionMinor = operation.agentCommissionAmountMinor ?? commissionMinor;

  return {
    agentCommissionMinor,
    commissionMinor,
    customerNetMinor,
    grossMinor,
  };
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: ComponentType<{ className?: string }>;
  helper?: string;
  label: string;
  value: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="truncate font-semibold text-xl">{value}</p>
          {helper ? <p className="text-muted-foreground text-xs">{helper}</p> : null}
        </div>
        <Icon className="size-5 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function StatusBlock({
  helper,
  icon: Icon,
  label,
  value,
}: {
  helper: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-sm">{label}</p>
        <Icon className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <p className="mt-2 font-semibold text-2xl">{value}</p>
      <p className="mt-1 text-muted-foreground text-xs">{helper}</p>
    </div>
  );
}
