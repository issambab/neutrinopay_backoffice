import { WalletsPage, type WalletsPageSearchParams } from "../_components/wallets-page";

export default function AgentWalletsPage({ searchParams }: { searchParams?: WalletsPageSearchParams }) {
  return (
    <WalletsPage
      activePath="/dashboard/wallets/agents"
      description="Wallets et comptes rattaches aux agents cash pour suivre les balances operationnelles par owner."
      ownerType="cash_agent"
      searchParams={searchParams}
      title="Agent Wallets"
    />
  );
}
