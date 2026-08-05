import type { ComponentType } from "react";

import Link from "next/link";

import { CheckCircle2, ShieldCheck, ShoppingBag, Store, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="outline" className="mb-3">
            Backoffice admin
          </Badge>
          <h1 className="font-semibold text-2xl tracking-tight">Pilotage NetrinoPay</h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            Acces rapide aux modules operationnels: utilisateurs wallet, marchands, KYC, boutiques et commandes.
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
              description="Verifier les documents CIN, selfie et justificatif adresse."
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sante plateforme</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <StatusLine label="Authentification admin" value="Active" />
            <StatusLine label="KYC & Compliance" value="Operationnel" />
            <StatusLine label="Commerce" value="Phase catalogue/commandes" />
            <StatusLine label="Wallet customer" value="Socle en cours" />
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

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-4 text-emerald-600" />
        <span>{label}</span>
      </div>
      <Badge variant="secondary">{value}</Badge>
    </div>
  );
}
