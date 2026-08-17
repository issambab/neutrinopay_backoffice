import type { ComponentType } from "react";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  Landmark,
  Lightbulb,
  LockKeyhole,
  QrCode,
  SendHorizontal,
  Smartphone,
  WalletCards,
  XCircle,
} from "lucide-react";
import { siMastercard } from "simple-icons";

import LogoNeutrinoCar from "@/components/icon/logo-neutrino-car";
import { SimpleIcon } from "@/components/simple-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getCurrentUserProfile } from "@/lib/auth/auth.server";
import type { CurrentUserResponse } from "@/lib/auth/auth.types";
import {
  getCurrentCustomerWallet,
  getCurrentCustomerWalletBalance,
  getCurrentCustomerWalletEligibility,
  listCurrentCustomerWalletTransactions,
} from "@/lib/wallet/wallet.server";
import type {
  CustomerWalletEligibilityResponse,
  WalletAccountResponse,
  WalletBalanceResponse,
  WalletResponse,
  WalletTransactionResponse,
} from "@/lib/wallet/wallet.types";
import {
  formatAssetMinorMoney,
  formatMinorMoney,
  formatWalletEnum,
  walletStatusClassName,
} from "@/lib/wallet/wallet-format";

import { ProvisionUserWalletButton } from "./provision-user-wallet-button";

export default async function UserDashboardPage() {
  const [profile, wallet, eligibility] = await Promise.all([
    getCurrentUserProfile(),
    safeGetWallet(),
    safeGetEligibility(),
  ]);
  const displayName = profile.user.fullName ?? profile.user.email ?? "Utilisateur wallet";
  const [transactions, walletBalance] = wallet
    ? await Promise.all([safeGetTransactions(), safeGetBalance()])
    : [[], null];
  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="flex flex-col gap-4 border-b bg-muted/25 px-5 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
          <div>
            <p className="font-medium text-muted-foreground text-sm">Compte wallet</p>
            <h1 className="font-semibold text-2xl tracking-tight">{displayName}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={walletStatusClassName(wallet?.status ?? "pending")}>
              Wallet {formatWalletEnum(wallet?.status ?? "non cree")}
            </Badge>
            <Badge
              variant="outline"
              className={
                eligibility?.eligible
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }
            >
              {eligibility?.eligible ? "Eligible" : "En verification"}
            </Badge>
          </div>
        </div>
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(19rem,0.78fr)] lg:p-5">
          <div className="grid gap-4">
            {wallet ? (
              <WalletOverviewPanel
                balance={walletBalance}
                displayName={displayName}
                eligibility={eligibility}
                profile={profile}
                wallet={wallet}
              />
            ) : (
              <MissingWalletPanel />
            )}
          </div>

          <div className="grid gap-4">
            <EligibilityRail eligibility={eligibility} />
            <WalletServicesPanel eligibility={eligibility} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={WalletCards} label="Solde disponible" value={formatDisplayBalance(wallet, walletBalance)} />
        <MetricCard
          icon={Clock3}
          label="Solde en attente"
          value={formatMinorMoney(wallet?.pendingBalanceMinor ?? 0, wallet?.defaultCurrency ?? "TND")}
        />
        <MetricCard icon={FileCheck2} label="KYC" value={formatWalletEnum(profile.user.kycStatus)} />
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

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Operations via agence</CardTitle>
              <CardDescription>Les operations cash seront executees par un agent autorise.</CardDescription>
            </div>
            <Badge variant="secondary">A venir</Badge>
          </div>
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

function WalletOverviewPanel({
  balance,
  displayName,
  eligibility,
  profile,
  wallet,
}: {
  balance: WalletBalanceResponse | null;
  displayName: string;
  eligibility: CustomerWalletEligibilityResponse | null;
  profile: CurrentUserResponse;
  wallet: WalletResponse;
}) {
  const eligibilityProgress = eligibilityScore(eligibility);
  const maskedWalletId = maskIdentifier(wallet.id);
  const displayBalance = balance
    ? formatAssetMinorMoney(balance.availableBalanceMinor, balance.currency, balance.asset)
    : formatMinorMoney(wallet.availableBalanceMinor, wallet.defaultCurrency);

  return (
    <Card className="overflow-hidden border bg-background shadow-none">
      <CardHeader className="flex gap-2 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>My Wallet</CardTitle>
            <CardDescription>{maskedWalletId}</CardDescription>
          </div>
          <Badge variant="outline" className={walletStatusClassName(wallet.status)}>
            {formatWalletEnum(wallet.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex min-w-0 items-center justify-center">
            <div className="relative flex aspect-8/5 w-full min-w-0 max-w-[25rem] flex-col justify-between overflow-hidden rounded-xl bg-[#111827] p-4 text-white shadow-sm sm:p-5 xl:max-w-[26rem]">
              <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(135deg,rgba(255,255,255,0.14)_0_1px,transparent_1px_18px)]" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(20,184,166,0.22))]" />
              <div className="flex items-start justify-between">
                <LogoNeutrinoCar className="relative size-8 text-white" />
                <div className="relative rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/85 text-xs">
                  {formatWalletEnum(wallet.walletType)}
                </div>
              </div>

              <div className="relative">
                <p className="text-white/65 text-xs uppercase tracking-wider">Solde disponible Ledger</p>
                <p className="mt-1 font-semibold text-2xl tracking-tight sm:text-3xl">{displayBalance}</p>
                <p className="mt-1 text-white/65 text-xs">
                  {balance
                    ? `${balance.asset} - ${balance.accountAddress}`
                    : `Solde local - En attente: ${formatMinorMoney(
                        wallet.pendingBalanceMinor,
                        wallet.defaultCurrency,
                      )}`}
                </p>
              </div>

              <div className="relative flex items-end justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <p className="truncate font-medium font-mono text-xs uppercase tracking-wide sm:text-sm">
                    {displayName}
                  </p>
                  <div className="flex gap-6">
                    <CardMeta label="Niveau" value={`N${walletLevel(eligibility)}`} />
                    <div>
                      <p className="text-[10px] text-white/60 uppercase tracking-wider">KYC</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={
                            profile.user.kycStatus === "verified"
                              ? "size-2 rounded-full bg-emerald-400"
                              : "size-2 rounded-full bg-amber-300"
                          }
                        />
                        <span className="font-mono text-white/80 text-xs">
                          {formatWalletEnum(profile.user.kycStatus)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <SimpleIcon icon={siMastercard} className="size-9 shrink-0 fill-white/80" />
              </div>
            </div>
          </div>

          <div className="grid content-between gap-5">
            <div className="grid gap-2 text-sm">
              <InfoLine label="Email" value={profile.user.email ?? "Non renseigne"} />
              <InfoLine label="Telephone" value={profile.user.phoneNumber ?? "Non renseigne"} />
              <InfoLine label="Devise" value={wallet.defaultCurrency} />
              <InfoLine label="Source solde" value={balance ? "Ledger" : "Local fallback"} />
              <InfoLine
                label="Comptes internes"
                value={`${wallet.accounts.length} ${wallet.accounts.length > 1 ? "comptes" : "compte"}`}
              />
            </div>

            <Separator />

            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="size-4 text-muted-foreground" />
                  <span className="font-medium">Eligibilite wallet</span>
                </div>
                <span className="font-medium tabular-nums">{eligibilityProgress}%</span>
              </div>
              <Progress value={eligibilityProgress} className="mt-3" />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button disabled variant="secondary" className="justify-start">
                <Landmark className="size-4" />
                Cash-in via agence
              </Button>
              <Button disabled variant="outline" className="justify-start">
                <CreditCard className="size-4" />
                Paiement bientot
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CardMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-white/60 uppercase tracking-wider">{label}</p>
      <p className="font-mono text-white/80 text-xs">{value}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border bg-background px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-medium tabular-nums">{value}</span>
    </div>
  );
}

function MissingWalletPanel() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-dashed bg-background p-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700">
          <AlertCircle className="size-5" />
        </div>
        <div>
          <p className="font-medium">Wallet non cree</p>
          <p className="text-muted-foreground text-sm">Le wallet principal doit etre provisionne.</p>
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
    {
      checked: eligibility?.complianceClear ?? false,
      label: "Compliance claire",
    },
  ];

  return (
    <div className="rounded-xl border bg-background p-4 shadow-xs">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Eligibilite transactions</p>
          <p className="text-muted-foreground text-xs">Lecture conformité du compte.</p>
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
          <div
            key={item.label}
            className={
              item.checked
                ? "flex items-center gap-2 rounded-md border border-emerald-100 bg-emerald-50/70 p-2 text-emerald-800 text-sm"
                : "flex items-center gap-2 rounded-md border bg-muted/25 p-2 text-sm"
            }
          >
            {item.checked ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4 text-amber-600" />}
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

function WalletServicesPanel({ eligibility }: { eligibility: CustomerWalletEligibilityResponse | null }) {
  const services = [
    { icon: QrCode, label: "Scan QR", ready: eligibility?.eligible ?? false },
    {
      icon: SendHorizontal,
      label: "Transfert",
      ready: eligibility?.eligible ?? false,
    },
    { icon: Smartphone, label: "Mobile", ready: false },
    { icon: Lightbulb, label: "Factures", ready: false },
  ];

  return (
    <div className="rounded-xl border bg-background p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-medium">Services</p>
        <Badge variant="secondary" className="font-normal">
          {eligibility?.eligible ? "Actif" : "Verrouille"}
        </Badge>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {services.map((service) => {
          const Icon = service.icon;

          return (
            <button
              aria-disabled={!service.ready}
              className={
                service.ready
                  ? "grid min-w-0 justify-items-center gap-2 rounded-lg p-2 text-muted-foreground text-xs transition-colors hover:bg-muted/40 hover:text-foreground"
                  : "grid min-w-0 cursor-not-allowed justify-items-center gap-2 rounded-lg p-2 text-muted-foreground/70 text-xs"
              }
              disabled={!service.ready}
              key={service.label}
              type="button"
            >
              <span
                className={
                  service.ready
                    ? "flex size-10 items-center justify-center rounded-full border bg-card text-primary"
                    : "flex size-10 items-center justify-center rounded-full border bg-muted/40"
                }
              >
                <Icon className="size-5" />
              </span>
              <span className="w-full truncate text-center">{service.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WalletAccountRow({ account }: { account: WalletAccountResponse }) {
  return (
    <div className="grid gap-3 rounded-lg border bg-card p-3 text-sm md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <WalletCards className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="font-medium">{formatWalletEnum(account.accountType)}</p>
          <p className="break-all text-muted-foreground text-xs">{account.ledgerAccountAddress}</p>
        </div>
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
    <Card size="sm" className="overflow-hidden shadow-xs">
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="font-semibold text-xl">{value}</p>
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
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
    <Button disabled variant="outline" className="h-auto justify-start gap-3 rounded-lg p-3 opacity-75">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-4" />
      </span>
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

function eligibilityScore(eligibility: CustomerWalletEligibilityResponse | null) {
  if (!eligibility) {
    return 0;
  }

  const checks = [
    eligibility.userActive,
    eligibility.emailVerified,
    eligibility.mfaEnabled,
    eligibility.kycVerified,
    eligibility.walletActive,
    eligibility.complianceClear,
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

function walletLevel(eligibility: CustomerWalletEligibilityResponse | null) {
  const score = eligibilityScore(eligibility);

  if (score >= 100) {
    return 3;
  }
  if (score >= 70) {
    return 2;
  }
  return 1;
}

function maskIdentifier(value: string) {
  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
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
    const page = await listCurrentCustomerWalletTransactions({
      page: 0,
      size: 5,
      sort: "createdAt,desc",
    });
    return page.content;
  } catch {
    return [] as WalletTransactionResponse[];
  }
}

async function safeGetBalance() {
  try {
    return await getCurrentCustomerWalletBalance();
  } catch {
    return null;
  }
}

async function safeGetEligibility() {
  try {
    return await getCurrentCustomerWalletEligibility();
  } catch {
    return null;
  }
}

function formatDisplayBalance(wallet: WalletResponse | null, balance: WalletBalanceResponse | null) {
  if (balance) {
    return formatAssetMinorMoney(balance.availableBalanceMinor, balance.currency, balance.asset);
  }

  return formatMinorMoney(wallet?.availableBalanceMinor ?? 0, wallet?.defaultCurrency ?? "TND");
}
