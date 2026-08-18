import { WalletsPage, type WalletsPageSearchParams } from "../_components/wallets-page";

export default function CustomerWalletsPage({ searchParams }: { searchParams?: WalletsPageSearchParams }) {
  return (
    <WalletsPage
      activePath="/dashboard/wallets/customers"
      description="Wallets clients relies aux comptes utilisateur, avec acces rapide au detail client et a la reconciliation."
      ownerType="user"
      searchParams={searchParams}
      title="Customer Wallets"
    />
  );
}
