import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getKycProfileByOwner, listKycProfileDocuments, listKycProfiles } from "@/lib/kyc/kyc.server";
import type { KycProfileResponse } from "@/lib/kyc/kyc.types";
import { formatKycEnum } from "@/lib/kyc/kyc-format";

import { KycAdminPanel } from "./_components/kyc-admin-panel";

type KycDashboardPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const STATUSES = ["pending", "in_review", "verified", "rejected", "expired"];

export default async function KycDashboardPage({ searchParams }: KycDashboardPageProps) {
  const { status = "" } = await searchParams;

  try {
    const profiles = await listKycProfiles({ ownerType: "business", size: 20, status });

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">KYC marchands</h1>
            <p className="text-muted-foreground text-sm">Validation des dossiers KYC et documents marchands.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/kyc/customers">KYC customers</Link>
            </Button>
            <Button asChild variant={status ? "outline" : "default"} size="sm">
              <Link href="/dashboard/kyc">Tous</Link>
            </Button>
            {STATUSES.map((item) => (
              <Button key={item} asChild variant={status === item ? "default" : "outline"} size="sm">
                <Link href={`/dashboard/kyc?status=${item}`}>{formatKycEnum(item)}</Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {profiles.content.length ? (
            profiles.content.map((profile) => <KycProfilePanel key={profile.id} profile={profile} />)
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                Aucun dossier KYC marchand trouve.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KYC indisponible</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Impossible de charger les dossiers KYC."}
        </CardContent>
      </Card>
    );
  }
}

async function KycProfilePanel({ profile }: { profile: KycProfileResponse }) {
  const freshProfile = (await getKycProfileByOwner(profile.ownerType, profile.ownerId)) ?? profile;
  const documents = await listKycProfileDocuments(profile.id, { size: 20 });

  return (
    <div className="grid gap-2">
      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/merchants/${profile.ownerId}`}>Ouvrir marchand</Link>
        </Button>
      </div>
      <KycAdminPanel
        documents={documents.content}
        ownerId={profile.ownerId}
        ownerLabel={profile.ownerId}
        ownerType="business"
        profile={freshProfile}
      />
    </div>
  );
}
