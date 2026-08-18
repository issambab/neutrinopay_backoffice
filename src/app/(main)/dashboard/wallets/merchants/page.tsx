import { WalletsPage, type WalletsPageSearchParams } from "../_components/wallets-page";

export default function MerchantWalletsPage({ searchParams }: { searchParams?: WalletsPageSearchParams }) {
  return (
    <WalletsPage
      activePath="/dashboard/wallets/merchants"
      description="Wallets marchands lies aux organisations business pour verifier statut, solde local et compte ledger."
      ownerType="business"
      searchParams={searchParams}
      title="Merchant Wallets"
    />
  );
}
