import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/lib/iam/users.server";
import { KYC_RISK_LEVELS } from "@/lib/kyc/kyc.constants";
import { getKycProfileByOwner, listKycProfileDocuments, listKycProfiles } from "@/lib/kyc/kyc.server";
import type { KycProfileResponse } from "@/lib/kyc/kyc.types";
import { formatKycEnum } from "@/lib/kyc/kyc-format";

import { KycAdminPanel } from "../_components/kyc-admin-panel";

type CustomerKycDashboardPageProps = {
  searchParams: Promise<{
    page?: string;
    riskLevel?: string;
    status?: string;
  }>;
};

const STATUSES = ["pending", "in_review", "verified", "rejected", "expired"];
const PAGE_SIZE = 10;

export default async function CustomerKycDashboardPage({ searchParams }: CustomerKycDashboardPageProps) {
  const { page: pageParam = "0", riskLevel = "", status = "" } = await searchParams;
  const page = Math.max(Number.parseInt(pageParam, 10) || 0, 0);

  try {
    const profiles = await listKycProfiles({
      ownerType: "user",
      page,
      riskLevel,
      size: PAGE_SIZE,
      status,
    });

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">KYC customers</h1>
            <p className="text-muted-foreground text-sm">Validation des dossiers KYC des utilisateurs wallet.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/kyc">KYC marchands</Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant={!status && !riskLevel ? "default" : "outline"} size="sm">
            <Link href="/dashboard/kyc/customers">Tous</Link>
          </Button>
          {STATUSES.map((item) => (
            <Button key={item} asChild variant={status === item ? "default" : "outline"} size="sm">
              <Link href={customerKycHref({ riskLevel, status: item })}>{formatKycEnum(item)}</Link>
            </Button>
          ))}
          {KYC_RISK_LEVELS.map((item) => (
            <Button key={item} asChild variant={riskLevel === item ? "default" : "outline"} size="sm">
              <Link href={customerKycHref({ riskLevel: item, status })}>Risque {formatKycEnum(item)}</Link>
            </Button>
          ))}
        </div>

        <div className="grid gap-4">
          {profiles.content.length ? (
            profiles.content.map((profile) => <CustomerKycProfilePanel key={profile.id} profile={profile} />)
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                Aucun dossier KYC customer trouve.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            Page {profiles.page + 1} / {Math.max(profiles.totalPages, 1)} - {profiles.totalElements} dossier(s)
          </span>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" disabled={profiles.first}>
              <Link href={customerKycHref({ page: Math.max(profiles.page - 1, 0), riskLevel, status })}>Precedent</Link>
            </Button>
            <Button asChild variant="outline" size="sm" disabled={profiles.last}>
              <Link href={customerKycHref({ page: profiles.page + 1, riskLevel, status })}>Suivant</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KYC customers indisponible</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Impossible de charger les dossiers KYC customers."}
        </CardContent>
      </Card>
    );
  }
}

async function CustomerKycProfilePanel({ profile }: { profile: KycProfileResponse }) {
  const [freshProfile, documents, user] = await Promise.all([
    getKycProfileByOwner(profile.ownerType, profile.ownerId).then((value) => value ?? profile),
    listKycProfileDocuments(profile.id, { size: 50 }),
    getUser(profile.ownerId).catch(() => null),
  ]);
  const ownerLabel = user?.fullName ?? user?.email ?? profile.ownerId;

  return (
    <div className="grid gap-2">
      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/users/${profile.ownerId}`}>Ouvrir utilisateur</Link>
        </Button>
      </div>
      <KycAdminPanel
        documents={documents.content}
        ownerId={profile.ownerId}
        ownerLabel={ownerLabel}
        ownerType="user"
        profile={freshProfile}
      />
    </div>
  );
}

function customerKycHref({
  page,
  riskLevel,
  status,
}: {
  page?: number;
  riskLevel?: string;
  status?: string;
}) {
  const searchParams = new URLSearchParams();
  if (page) {
    searchParams.set("page", String(page));
  }
  if (status) {
    searchParams.set("status", status);
  }
  if (riskLevel) {
    searchParams.set("riskLevel", riskLevel);
  }
  const query = searchParams.toString();
  return query ? `/dashboard/kyc/customers?${query}` : "/dashboard/kyc/customers";
}
