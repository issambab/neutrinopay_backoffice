import { WalletsPage, type WalletsPageSearchParams } from "./_components/wallets-page";

export default function AllWalletsPage({ searchParams }: { searchParams?: WalletsPageSearchParams }) {
  return (
    <WalletsPage
      activePath="/dashboard/wallets"
      description="Vue consolidee de tous les wallets du tenant, avec statut, owner, compte principal et solde local."
      searchParams={searchParams}
      title="All Wallets"
    />
  );
}
