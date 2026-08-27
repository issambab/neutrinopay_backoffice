import type { ComponentType } from "react";

import Link from "next/link";

import {
  CheckCircle2,
  CreditCard,
  Landmark,
  ShieldCheck,
  ShoppingBag,
  SquareTerminal,
  Store,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { MetricCards } from "./_components/metric-cards";
import { PerformanceOverview } from "./_components/performance-overview";
import { SubscriberOverview } from "./_components/subscriber-overview";

const operations = [
  {
    label: "KYC customer verifies",
    value: "1 284",
    progress: 82,
    status: "82% traite",
  },
  {
    label: "Terminals POS actifs",
    value: "438",
    progress: 74,
    status: "74% en ligne",
  },
  {
    label: "Marchands onboarding",
    value: "96",
    progress: 61,
    status: "61% complet",
  },
  {
    label: "Commandes boutique",
    value: "2 931",
    progress: 88,
    status: "88% livrees",
  },
];

const demoSignals = [
  { label: "Disponibilite API", value: "99.94%", tone: "Operationnel" },
  { label: "Temps moyen KYC", value: "11 min", tone: "Rapide" },
  { label: "Reconciliations wallet", value: "98.7%", tone: "Stable" },
  { label: "Alertes compliance", value: "14", tone: "A revoir" },
];

export default function Page() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="outline" className="mb-3">
            Backoffice admin - mode demo
          </Badge>
          <h1 className="font-semibold text-2xl tracking-tight">Pilotage NetrinoPay</h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            Vue executive avec KPI, activite wallet, suivi KYC, marchands, terminaux POS et ventes boutique pour la
            presentation demo.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/kyc/customers">Revoir les KYC customer</Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard icon={UsersRound} label="Utilisateurs" value="IAM & wallets" href="/dashboard/users" />
        <AdminMetricCard icon={Store} label="Marchands" value="Organisation" href="/dashboard/merchants" />
        <AdminMetricCard icon={ShieldCheck} label="KYC" value="Files de revue" href="/dashboard/kyc/customers" />
        <AdminMetricCard icon={ShoppingBag} label="Boutiques" value="Catalogue & ventes" href="/dashboard/stores" />
      </div>

      <MetricCards />

      <PerformanceOverview />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.6fr)]">
        <SubscriberOverview />

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution operationnelle</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {operations.map((operation) => (
                <div className="grid gap-2" key={operation.label}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{operation.label}</p>
                      <p className="text-muted-foreground text-xs">{operation.status}</p>
                    </div>
                    <span className="font-semibold text-sm tabular-nums">{operation.value}</span>
                  </div>
                  <Progress value={operation.progress} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Signaux temps reel</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {demoSignals.map((signal) => (
                <StatusLine key={signal.label} label={signal.label} value={signal.value} tone={signal.tone} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Priorites operationnelles</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ActionRow
              href="/dashboard/kyc/customers"
              icon={ShieldCheck}
              title="Validation KYC customer"
              description="Files demo: documents CIN, selfie et justificatif adresse a valider."
            />
            <ActionRow
              href="/dashboard/merchants"
              icon={Store}
              title="Onboarding marchand"
              description="Suivre stations, points de vente, terminaux et statut KYC marchand."
            />
            <ActionRow
              href="/dashboard/stores"
              icon={ShoppingBag}
              title="Supervision boutique"
              description="Controler produits, categories, commandes et ventes ecommerce."
            />
            <ActionRow
              href="/dashboard/terminals"
              icon={SquareTerminal}
              title="Parc terminaux POS"
              description="Suivre activation, connectivite et affectation des terminaux."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sante plateforme</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <StatusLine label="Authentification admin" value="Active" icon={ShieldCheck} />
            <StatusLine label="Flux wallet customer" value="Stable" icon={CreditCard} />
            <StatusLine label="Cash-in / Cash-out agent" value="Sous surveillance" icon={Landmark} />
            <StatusLine label="Commerce" value="Catalogue/commandes" icon={ShoppingBag} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminMetricCard({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="transition-colors hover:bg-muted/40">
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="font-semibold text-lg">{value}</p>
          <Link href={href} className="mt-2 inline-flex text-primary text-sm hover:underline">
            Ouvrir
          </Link>
        </div>
        <div className="flex size-10 items-center justify-center rounded-md border bg-background">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function ActionRow({
  description,
  href,
  icon: Icon,
  title,
}: {
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <Link href={href} className="flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/40">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </Link>
  );
}

function StatusLine({
  icon: Icon = CheckCircle2,
  label,
  tone,
  value,
}: {
  icon?: ComponentType<{ className?: string }>;
  label: string;
  tone?: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-emerald-600" />
        <span className="min-w-0">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {tone ? <span className="hidden text-muted-foreground text-xs sm:inline">{tone}</span> : null}
        <Badge variant="secondary">{value}</Badge>
      </div>
    </div>
  );
}
