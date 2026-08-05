import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMerchantKycProfile, listMerchantKycDocuments } from "@/lib/kyc/kyc.server";
import { getMerchantWorkspace } from "@/lib/merchant/merchant.server";

import { MerchantEmptyState } from "../_components/merchant-empty-state";
import { MerchantKycPanel } from "./merchant-kyc-panel";

export default async function MerchantKycPage() {
  const { business } = await getMerchantWorkspace();

  if (!business) {
    return <MerchantEmptyState text="Aucun marchand n'est rattache a ce compte." />;
  }

  try {
    const profile = await getMerchantKycProfile();
    const documents = profile ? await listMerchantKycDocuments() : null;

    return <MerchantKycPanel business={business} documents={documents?.content ?? []} profile={profile} />;
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KYC indisponible</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Impossible de charger votre dossier KYC."}
        </CardContent>
      </Card>
    );
  }
}
