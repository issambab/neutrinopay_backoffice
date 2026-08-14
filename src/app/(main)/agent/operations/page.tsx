import type { ComponentType } from "react";

import { CheckCircle2, Clock3, ReceiptText, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCurrentAgentFloatBalance,
  getCurrentAgentProfile,
  listCurrentAgentCashOperations,
} from "@/lib/cash/cash.server";
import { formatMinorAmount } from "@/lib/cash/cash-format";

import { AgentOperationsTable } from "./_components/agent-operations-table";

type AgentOperationsPageProps = {
  searchParams?: Promise<{
    page?: string;
    size?: string;
    sort?: string;
  }>;
};

const PAGE_SIZE = 20;

export default async function AgentOperationsPage({ searchParams }: AgentOperationsPageProps) {
  const params = await searchParams;
  const page = toPageNumber(params?.page);
  const pageSize = toPageSize(params?.size);
  const sort = toCashOperationSort(params?.sort);

  try {
    const [profile, floatBalance, operations] = await Promise.all([
      getCurrentAgentProfile(),
      getCurrentAgentFloatBalance(),
      listCurrentAgentCashOperations({ page, size: pageSize, sort }),
    ]);
    const postedCount = operations.content.filter((operation) => operation.status === "posted").length;
    const waitingCount = operations.content.filter((operation) =>
      ["otp_pending", "prepared"].includes(operation.status),
    ).length;

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Operations agent</h1>
            <p className="text-muted-foreground text-sm">
              Historique pagine des Cash-in/Cash-out traites par votre caisse.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {profile.agencyCode} - {operations.totalElements} operations
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard
            icon={WalletCards}
            label="Float disponible"
            value={formatMinorAmount(floatBalance.availableBalanceMinor, floatBalance.currency)}
          />
          <MetricCard icon={ReceiptText} label="Total historique" value={operations.totalElements.toString()} />
          <MetricCard icon={CheckCircle2} label="Postees sur page" value={postedCount.toString()} />
          <MetricCard icon={Clock3} label="En cours sur page" value={waitingCount.toString()} />
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Journal de caisse</CardTitle>
          </CardHeader>
          <CardContent>
            <AgentOperationsTable operations={operations} pageSize={pageSize} sort={sort} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Operations agent</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger votre historique de caisse.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Historique indisponible</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Le backend cash ne repond pas."}
          </CardContent>
        </Card>
      </div>
    );
  }
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="truncate font-semibold text-xl">{value}</p>
        </div>
        <Icon className="size-5 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function toPageNumber(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function toPageSize(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : PAGE_SIZE;
}

function toCashOperationSort(value?: string) {
  const allowedSorts = new Set([
    "amountMinor,asc",
    "amountMinor,desc",
    "createdAt,asc",
    "createdAt,desc",
    "operationType,asc",
    "operationType,desc",
    "postedAt,asc",
    "postedAt,desc",
    "status,asc",
    "status,desc",
  ]);

  return value && allowedSorts.has(value) ? value : "createdAt,desc";
}
