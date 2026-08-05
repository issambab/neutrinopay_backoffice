import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listMerchantOrders } from "@/lib/commerce/commerce.server";
import type { CommerceOrderStatus } from "@/lib/commerce/commerce.types";
import { getMerchantWorkspace } from "@/lib/merchant/merchant.server";

import { MerchantEmptyState } from "../_components/merchant-empty-state";
import { MerchantOrdersPanel } from "./merchant-orders-panel";

type MerchantOrdersPageProps = {
  searchParams: Promise<{
    status?: CommerceOrderStatus | string;
  }>;
};

export default async function MerchantOrdersPage({ searchParams }: MerchantOrdersPageProps) {
  const { business } = await getMerchantWorkspace();
  const filters = await searchParams;

  if (!business) {
    return <MerchantEmptyState text="Aucun marchand n'est rattache a ce compte." />;
  }

  try {
    const [orders, pendingOrders] = await Promise.all([
      listMerchantOrders({
        size: 100,
        sort: "createdAt,desc",
        status: normalizeStatus(filters.status),
      }),
      listMerchantOrders({
        page: 0,
        size: 1,
        status: "pending",
      }),
    ]);

    return (
      <MerchantOrdersPanel
        initialStatus={normalizeStatus(filters.status) ?? "all"}
        orders={orders.content}
        pendingOrdersCount={pendingOrders.totalElements}
      />
    );
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commandes indisponibles</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Impossible de charger vos commandes."}
        </CardContent>
      </Card>
    );
  }
}

function normalizeStatus(status?: string) {
  const allowedStatuses: CommerceOrderStatus[] = [
    "draft",
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "cancelled",
    "fulfilled",
  ];
  return allowedStatuses.find((value) => value === status);
}
