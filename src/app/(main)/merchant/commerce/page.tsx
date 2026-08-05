import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getMerchantCommerceStore,
  listMerchantProductCategories,
  listMerchantProducts,
} from "@/lib/commerce/commerce.server";
import { getMerchantWorkspace } from "@/lib/merchant/merchant.server";

import { MerchantEmptyState } from "../_components/merchant-empty-state";
import { MerchantCommercePanel } from "./merchant-commerce-panel";

export default async function MerchantCommercePage() {
  const { business } = await getMerchantWorkspace();

  if (!business) {
    return <MerchantEmptyState text="Aucun marchand n'est rattache a ce compte." />;
  }

  try {
    const store = await getMerchantCommerceStore();
    const [categories, products] = store
      ? await Promise.all([
          listMerchantProductCategories({ size: 100, sort: "sortOrder,asc" }),
          listMerchantProducts({ size: 100, sort: "createdAt,desc" }),
        ])
      : [null, null];

    return (
      <MerchantCommercePanel
        business={business}
        categories={categories?.content ?? []}
        products={products?.content ?? []}
        store={store}
      />
    );
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commerce indisponible</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Impossible de charger votre catalogue."}
        </CardContent>
      </Card>
    );
  }
}
