import { WalletMovementsCard } from "@/app/(main)/dashboard/wallets/[walletId]/_components/wallet-movements-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMerchantWorkspace } from "@/lib/merchant/merchant.server";
import { listCurrentMerchantWalletTransactions } from "@/lib/wallet/wallet.server";

import { MerchantEmptyState } from "../_components/merchant-empty-state";

type MerchantTransactionsPageProps = {
  searchParams?: Promise<{
    txPage?: string;
    txSize?: string;
    txSort?: string;
  }>;
};

export default async function MerchantTransactionsPage({ searchParams }: MerchantTransactionsPageProps) {
  const query = await searchParams;
  const { business } = await getMerchantWorkspace();

  if (!business) {
    return <MerchantEmptyState text="Aucun marchand n'est rattache a ce compte." />;
  }

  const pageSize = parseTransactionPageSize(query?.txSize);

  try {
    const transactions = await listCurrentMerchantWalletTransactions({
      page: parseTransactionPage(query?.txPage),
      size: pageSize,
      sort: query?.txSort?.trim() || "createdAt,desc",
    });

    return (
      <div className="grid gap-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Transactions</h1>
            <p className="text-muted-foreground text-sm">Tous les mouvements du wallet marchand de {business.name}.</p>
          </div>
          <Badge variant="outline">{transactions.totalElements} transaction(s)</Badge>
        </div>

        <WalletMovementsCard
          description="Historique complet des credits, debits et ajustements postes sur votre wallet marchand."
          emptyDescription="Les paiements et autres mouvements du commerce apparaitront ici."
          emptyTitle="Aucune transaction marchand"
          pageSize={pageSize}
          showCashOperationDetails={false}
          title="Transactions marchand"
          transactions={transactions}
        />
      </div>
    );
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions indisponibles</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Impossible de charger les transactions marchand."}
        </CardContent>
      </Card>
    );
  }
}

function parseTransactionPage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function parseTransactionPageSize(value: string | undefined) {
  const parsed = Number(value);
  return [10, 20, 30, 40, 50].includes(parsed) ? parsed : 10;
}
