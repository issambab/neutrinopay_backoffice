import type { ComponentType } from "react";

import Link from "next/link";

import { ArrowLeft, CalendarClock, CheckCircle2, FileWarning, MailCheck, ShieldCheck, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listComplianceCasesByOwner } from "@/lib/compliance/compliance.server";
import type { ComplianceCaseResponse } from "@/lib/compliance/compliance.types";
import {
  complianceRiskClassName,
  complianceStatusClassName,
  formatComplianceDate,
  formatComplianceEnum,
} from "@/lib/compliance/compliance-format";
import { getUser } from "@/lib/iam/users.server";
import { getKycProfileByOwner, listKycProfileDocuments } from "@/lib/kyc/kyc.server";
import type { KycDocumentResponse, KycProfileResponse } from "@/lib/kyc/kyc.types";
import { cn } from "@/lib/utils";
import { getAdminCustomerWalletEligibility, listAdminWallets } from "@/lib/wallet/wallet.server";
import type { CustomerWalletEligibilityResponse, WalletResponse } from "@/lib/wallet/wallet.types";

import { KycAdminPanel } from "../../kyc/_components/kyc-admin-panel";
import { UserEditForm } from "./_components/user-edit-form";
import { UserWalletCard } from "./_components/user-wallet-card";

type UserDetailPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params;

  try {
    const user = await getUser(userId);
    const wallet = user.userType === "client" ? await safeGetUserWallet(user.id) : null;
    const kycProfile = user.userType === "client" ? await safeGetUserKycProfile(user.id) : null;
    const kycDocuments = kycProfile ? await safeGetUserKycDocuments(kycProfile.id) : [];
    const complianceCases = user.userType === "client" ? await safeGetUserComplianceCases(user.id) : [];
    const eligibility = user.userType === "client" ? await safeGetUserEligibility(user.id) : null;

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <Button asChild variant="ghost" className="w-fit px-0">
              <Link href="/dashboard/users">
                <ArrowLeft />
                Retour aux utilisateurs
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold text-2xl tracking-tight">{user.fullName ?? user.email ?? user.id}</h1>
              <p className="text-muted-foreground text-sm">{user.email ?? user.phoneNumber ?? user.id}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={statusClassName(user.status)}>
              {formatEnum(user.status)}
            </Badge>
            <Badge variant="outline">{formatEnum(user.userType)}</Badge>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <InfoCard label="KYC" value={formatEnum(user.kycStatus)} icon={ShieldCheck} />
          <InfoCard label="Email" value={user.emailVerifiedAt ? "Verifie" : "Non verifie"} icon={MailCheck} />
          <InfoCard label="MFA" value={user.mfaEnabled ? "Active" : "Inactive"} icon={ShieldCheck} />
          <InfoCard
            label="Derniere connexion"
            value={user.lastLoginAt ? formatDate(user.lastLoginAt) : "Jamais"}
            icon={CalendarClock}
          />
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Modifier les informations</CardTitle>
          </CardHeader>
          <CardContent>
            <UserEditForm user={user} />
          </CardContent>
        </Card>

        {user.userType === "client" ? <UserWalletCard wallet={wallet} /> : null}
        {user.userType === "client" ? <UserEligibilityCard eligibility={eligibility} /> : null}

        {user.userType === "client" ? (
          <KycAdminPanel
            documents={kycDocuments}
            ownerId={user.id}
            ownerLabel={user.fullName ?? user.email ?? user.id}
            ownerType="user"
            profile={kycProfile}
          />
        ) : null}

        {user.userType === "client" ? <UserComplianceCard complianceCases={complianceCases} /> : null}
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" className="w-fit px-0">
          <Link href="/dashboard/users">
            <ArrowLeft />
            Retour aux utilisateurs
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Utilisateur indisponible</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Impossible de charger cet utilisateur."}
          </CardContent>
        </Card>
      </div>
    );
  }
}

async function safeGetUserComplianceCases(userId: string): Promise<ComplianceCaseResponse[]> {
  try {
    const cases = await listComplianceCasesByOwner({
      ownerId: userId,
      ownerType: "user",
      page: 0,
      size: 20,
      sort: "createdAt,desc",
    });
    return cases.content;
  } catch {
    return [];
  }
}

async function safeGetUserEligibility(userId: string): Promise<CustomerWalletEligibilityResponse | null> {
  try {
    return await getAdminCustomerWalletEligibility(userId);
  } catch {
    return null;
  }
}

async function safeGetUserKycProfile(userId: string): Promise<KycProfileResponse | null> {
  try {
    return await getKycProfileByOwner("user", userId);
  } catch {
    return null;
  }
}

function UserEligibilityCard({ eligibility }: { eligibility: CustomerWalletEligibilityResponse | null }) {
  const items = [
    { checked: eligibility?.userActive ?? false, label: "Compte actif" },
    { checked: eligibility?.emailVerified ?? false, label: "Email verifie" },
    { checked: eligibility?.mfaEnabled ?? false, label: "MFA activee" },
    { checked: eligibility?.kycVerified ?? false, label: "KYC valide" },
    { checked: eligibility?.walletActive ?? false, label: "Wallet actif" },
    { checked: eligibility?.complianceClear ?? false, label: "Compliance claire" },
  ];

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Eligibilite wallet</CardTitle>
          <Badge
            variant="outline"
            className={
              eligibility?.eligible
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }
          >
            {eligibility?.eligible ? "Pret pour operations agence" : "Non eligible"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {eligibility ? (
          <>
            <div className="grid gap-2 md:grid-cols-3">
              {items.map((item) => (
                <div key={item.label} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  {item.checked ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : (
                    <XCircle className="size-4 text-amber-600" />
                  )}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            {eligibility.blockingReasons.length ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
                <p className="font-medium">Raisons de blocage</p>
                <ul className="mt-2 grid gap-1">
                  {eligibility.blockingReasons.map((reason) => (
                    <li key={reason}>{eligibilityReasonLabel(reason)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {eligibility.activeComplianceCaseIds.length ? (
              <div className="flex flex-wrap gap-2">
                {eligibility.activeComplianceCaseIds.map((caseId) => (
                  <Button key={caseId} asChild variant="outline" size="sm">
                    <Link href={`/dashboard/compliance/${caseId}`}>Ouvrir Compliance</Link>
                  </Button>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <p className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
            Eligibilite indisponible pour ce customer.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function UserComplianceCard({ complianceCases }: { complianceCases: ComplianceCaseResponse[] }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Compliance customer</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {complianceCases.length ? (
          complianceCases.map((complianceCase) => (
            <div
              key={complianceCase.id}
              className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                  <FileWarning className="size-4 text-muted-foreground" />
                </span>
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{complianceCase.title}</span>
                    <Badge variant="outline" className={complianceStatusClassName(complianceCase.status)}>
                      {formatComplianceEnum(complianceCase.status)}
                    </Badge>
                    <Badge variant="outline" className={complianceRiskClassName(complianceCase.riskLevel)}>
                      Risque {formatComplianceEnum(complianceCase.riskLevel)}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {formatComplianceEnum(complianceCase.caseType)} - ouvert le{" "}
                    {formatComplianceDate(complianceCase.openedAt)}
                  </div>
                  {complianceCase.resolution ? (
                    <div className="text-muted-foreground text-sm">{complianceCase.resolution}</div>
                  ) : null}
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="w-fit">
                <Link href={`/dashboard/compliance/${complianceCase.id}`}>Ouvrir</Link>
              </Button>
            </div>
          ))
        ) : (
          <div className="rounded-md border bg-muted/20 p-4 text-center text-muted-foreground text-sm">
            Aucune enquete compliance pour ce customer.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function safeGetUserKycDocuments(profileId: string): Promise<KycDocumentResponse[]> {
  try {
    const documents = await listKycProfileDocuments(profileId, { size: 50 });
    return documents.content;
  } catch {
    return [];
  }
}

async function safeGetUserWallet(userId: string): Promise<WalletResponse | null> {
  try {
    const wallets = await listAdminWallets({
      ownerId: userId,
      ownerType: "user",
      page: 0,
      size: 1,
      sort: "createdAt,desc",
    });
    return wallets.content[0] ?? null;
  } catch {
    return null;
  }
}

function InfoCard({
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
          <p className="font-semibold text-lg">{value}</p>
        </div>
        <Icon className="size-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClassName(status: string) {
  return cn(
    status === "active" && "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
    status !== "active" && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  );
}

function eligibilityReasonLabel(reason: string) {
  const labels: Record<string, string> = {
    compliance_case_active: "Dossier Compliance actif.",
    email_not_verified: "Email non verifie.",
    kyc_not_verified: "KYC non valide.",
    mfa_not_enabled: "MFA non activee.",
    user_not_active: "Compte utilisateur non actif.",
    wallet_not_active: "Wallet non actif.",
  };

  return labels[reason] ?? formatEnum(reason);
}
