import type { ComponentType } from "react";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Landmark,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/auth/auth.server";
import {
  getCurrentCustomerWallet,
  getCurrentCustomerWalletEligibility,
  listCurrentCustomerWalletTransactions,
} from "@/lib/wallet/wallet.server";
import type {
  CustomerWalletEligibilityResponse,
  WalletAccountResponse,
  WalletResponse,
  WalletTransactionResponse,
} from "@/lib/wallet/wallet.types";
import { formatMinorMoney, formatWalletEnum, walletStatusClassName } from "@/lib/wallet/wallet-format";

import { ProvisionUserWalletButton } from "./provision-user-wallet-button";

export default async function UserDashboardPage() {
  const [profile, wallet, eligibility] = await Promise.all([
    getCurrentUserProfile(),
    safeGetWallet(),
    safeGetEligibility(),
  ]);
  const transactions = wallet ? await safeGetTransactions() : [];
  const displayName = profile.user.fullName ?? profile.user.email ?? "Utilisateur wallet";

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-lg border bg-[#f7faf9]">
        <div className="grid gap-4 p-5 lg:grid-cols-[1.1fr_0.9fr] lg:p-6">
          <div className="grid gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Bonjour,</p>
                <h1 className="font-semibold text-2xl tracking-tight">{displayName}</h1>
          <p className="text-muted-foreground text-sm">
            Suivez votre wallet, votre KYC et les conditions avant les futures operations via agence.
          </p>
              </div>
              <Badge variant="outline" className={walletStatusClassName(wallet?.status ?? "pending")}>
                Wallet {formatWalletEnum(wallet?.status ?? "non cree")}
              </Badge>
            </div>

            {wallet ? <BalancePanel wallet={wallet} /> : <MissingWalletPanel />}
          </div>

          <EligibilityRail eligibility={eligibility} />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          icon={WalletCards}
          label="Solde disponible"
          value={formatMinorMoney(wallet?.availableBalanceMinor ?? 0, wallet?.defaultCurrency ?? "TND")}
        />
        <MetricCard
          icon={Clock3}
          label="Solde en attente"
          value={formatMinorMoney(wallet?.pendingBalanceMinor ?? 0, wallet?.defaultCurrency ?? "TND")}
        />
        <MetricCard icon={ShieldCheck} label="KYC" value={formatWalletEnum(profile.user.kycStatus)} />
        <MetricCard icon={CreditCard} label="Comptes" value={String(wallet?.accounts.length ?? 0)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Comptes wallet</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {wallet?.accounts.length ? (
              wallet.accounts.map((account) => <WalletAccountRow key={account.id} account={account} />)
            ) : (
              <EmptyText text="Aucun compte wallet disponible." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Dernieres transactions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {transactions.length ? (
              transactions.map((transaction) => (
                <div key={transaction.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{formatWalletEnum(transaction.operationType)}</span>
                    <span>{formatMinorMoney(transaction.amountMinor, wallet?.defaultCurrency ?? "TND")}</span>
                  </div>
                  <p className="text-muted-foreground text-xs">{formatWalletEnum(transaction.status)}</p>
                </div>
              ))
            ) : (
              <EmptyText text="Aucune transaction pour le moment." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Operations via agence</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <OperationButton icon={Landmark} label="Cash-in en agence" note="Disponible via agent apres KYC." />
          <OperationButton icon={Landmark} label="Cash-out en agence" note="Autorisation OTP a venir." />
          <OperationButton icon={CreditCard} label="Transfert" note="Bientot disponible." />
          <OperationButton icon={CreditCard} label="Paiement" note="Bientot disponible." />
        </CardContent>
      </Card>
    </div>
  );
}

function BalancePanel({ wallet }: { wallet: WalletResponse }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-muted-foreground text-sm">Balance principale</p>
      <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-4xl tracking-tight">
            {formatMinorMoney(wallet.availableBalanceMinor, wallet.defaultCurrency)}
          </p>
          <p className="text-muted-foreground text-xs">
            En attente: {formatMinorMoney(wallet.pendingBalanceMinor, wallet.defaultCurrency)}
          </p>
        </div>
        <Badge variant="outline" className={walletStatusClassName(wallet.status)}>
          {formatWalletEnum(wallet.status)}
        </Badge>
      </div>
    </div>
  );
}

function MissingWalletPanel() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-dashed bg-background p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 text-amber-600" />
        <div>
          <p className="font-medium">Wallet non cree</p>
          <p className="text-muted-foreground text-sm">
            Votre compte existe, mais le wallet principal n'est pas encore provisionne.
          </p>
        </div>
      </div>
      <ProvisionUserWalletButton />
    </div>
  );
}

function EligibilityRail({ eligibility }: { eligibility: CustomerWalletEligibilityResponse | null }) {
  const items = [
    { checked: eligibility?.userActive ?? false, label: "Compte actif" },
    { checked: eligibility?.emailVerified ?? false, label: "Email verifie" },
    { checked: eligibility?.mfaEnabled ?? false, label: "MFA activee" },
    { checked: eligibility?.kycVerified ?? false, label: "KYC valide" },
    { checked: eligibility?.walletActive ?? false, label: "Wallet actif" },
    { checked: eligibility?.complianceClear ?? false, label: "Compliance claire" },
  ];

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Eligibilite transactions</p>
          <p className="text-muted-foreground text-xs">Conditions avant operations financieres.</p>
        </div>
        <Badge
          variant="outline"
          className={
            eligibility?.eligible
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }
        >
          {eligibility?.eligible ? "Pret" : "Limite"}
        </Badge>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 rounded-md border p-2 text-sm">
            {item.checked ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <XCircle className="size-4 text-amber-600" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      {eligibility?.blockingReasons.length ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
          <p className="font-medium">Points a traiter</p>
          <ul className="mt-2 grid gap-1">
            {eligibility.blockingReasons.map((reason) => (
              <li key={reason}>{eligibilityReasonLabel(reason)}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function WalletAccountRow({ account }: { account: WalletAccountResponse }) {
  return (
    <div className="grid gap-2 rounded-md border p-3 text-sm md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="font-medium">{formatWalletEnum(account.accountType)}</p>
        <p className="break-all text-muted-foreground text-xs">{account.ledgerAccountAddress}</p>
      </div>
      <div className="text-left md:text-right">
        <p className="font-semibold">{formatMinorMoney(account.availableBalanceMinor, account.currency)}</p>
        <Badge variant="outline" className={walletStatusClassName(account.status)}>
          {formatWalletEnum(account.status)}
        </Badge>
      </div>
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
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="font-semibold text-xl">{value}</p>
        </div>
        <Icon className="size-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function OperationButton({
  icon: Icon,
  label,
  note,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  note: string;
}) {
  return (
    <Button disabled variant="outline" className="h-auto justify-start gap-3 p-3">
      <Icon className="size-4" />
      <span className="grid text-left">
        <span>{label}</span>
        <span className="font-normal text-muted-foreground text-xs">{note}</span>
      </span>
    </Button>
  );
}

function eligibilityReasonLabel(reason: string) {
  const labels: Record<string, string> = {
    compliance_case_active: "Un dossier Compliance actif bloque les operations.",
    email_not_verified: "Email non verifie.",
    kyc_not_verified: "KYC non valide.",
    mfa_not_enabled: "MFA non activee.",
    user_not_active: "Compte utilisateur non actif.",
    wallet_not_active: "Wallet non actif.",
  };

  return labels[reason] ?? reason.replaceAll("_", " ");
}

function EmptyText({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">{text}</p>;
}

async function safeGetWallet() {
  try {
    return await getCurrentCustomerWallet();
  } catch {
    return null;
  }
}

async function safeGetTransactions() {
  try {
    const page = await listCurrentCustomerWalletTransactions({ page: 0, size: 5, sort: "createdAt,desc" });
    return page.content;
  } catch {
    return [] as WalletTransactionResponse[];
  }
}

async function safeGetEligibility() {
  try {
    return await getCurrentCustomerWalletEligibility();
  } catch {
    return null;
  }
}
