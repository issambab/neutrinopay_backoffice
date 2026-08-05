import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listComplianceCasesByOwner } from "@/lib/compliance/compliance.server";
import {
  getBusiness,
  listBusinessMerchantUsers,
  listBusinessPointsOfSale,
  listBusinessStations,
  listPointOfSaleTerminals,
} from "@/lib/organization/organization.server";
import { getKycProfileByOwner, listKycProfileDocuments } from "@/lib/kyc/kyc.server";

import { MerchantDetail } from "../_components/merchant-detail";

type MerchantDetailPageProps = {
  params: Promise<{
    businessId: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function MerchantDetailPage({ params, searchParams }: MerchantDetailPageProps) {
  const { businessId } = await params;
  const { tab = "overview" } = await searchParams;

  try {
    const [business, stations, pointsOfSale, merchantUsers, kycProfile, complianceCases] = await Promise.all([
      getBusiness(businessId),
      listBusinessStations(businessId, { size: 50 }),
      listBusinessPointsOfSale(businessId, { size: 50 }),
      listBusinessMerchantUsers(businessId),
      getKycProfileByOwner("business", businessId),
      listComplianceCasesByOwner({ ownerId: businessId, ownerType: "business", size: 50 }),
    ]);
    const terminalPages = await Promise.all(
      pointsOfSale.content.map((pointOfSale) => listPointOfSaleTerminals(pointOfSale.id, { size: 50 })),
    );
    const terminals = terminalPages.flatMap((page) => page.content);
    const kycDocuments = kycProfile ? await listKycProfileDocuments(kycProfile.id, { size: 50 }) : null;

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">{business.name}</h1>
            <p className="text-muted-foreground text-sm">
              Detail marchand, stations, points de vente et terminaux affectes.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/merchants">
              <ArrowLeft />
              Retour
            </Link>
          </Button>
        </div>

        <MerchantDetail
          business={business}
          stations={stations.content}
          pointsOfSale={pointsOfSale.content}
          terminals={terminals}
          merchantUsers={merchantUsers}
          kycProfile={kycProfile}
          kycDocuments={kycDocuments?.content ?? []}
          complianceCases={complianceCases.content}
          initialTab={tab}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("not found")) {
      notFound();
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Acces indisponible</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Impossible de charger le marchand."}
        </CardContent>
      </Card>
    );
  }
}
