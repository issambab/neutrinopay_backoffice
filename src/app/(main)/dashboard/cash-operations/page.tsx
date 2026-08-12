import type { ComponentType } from "react";

import { AlertTriangle, CheckCircle2, Clock3, ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCashOperations } from "@/lib/cash/cash.server";

import { CashOperationsTable } from "./_components/cash-operations-table";

type CashOperationsPageProps = {
  searchParams?: Promise<{
    operationType?: string;
    page?: string;
    q?: string;
    size?: string;
    sort?: string;
    status?: string;
  }>;
};

const PAGE_SIZE = 20;

export default async function CashOperationsPage({ searchParams }: CashOperationsPageProps) {
  const params = await searchParams;
  const page = toPageNumber(params?.page);
  const pageSize = toPageSize(params?.size);
  const sort = toCashOperationSort(params?.sort);
  const filters = {
    operationType: params?.operationType ?? "",
    q: params?.q ?? "",
    status: params?.status ?? "",
  };

  try {
    const operations = await listCashOperations({
      operationType: filters.operationType || undefined,
      page,
      q: filters.q || undefined,
      size: pageSize,
      sort,
      status: filters.status || undefined,
    });
    const pagePrepared = operations.content.filter((operation) => operation.status === "prepared").length;
    const pageFailed = operations.content.filter((operation) => operation.status === "failed").length;
    const pagePosted = operations.content.filter((operation) => operation.status === "posted").length;

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Operations cash</h1>
            <p className="text-muted-foreground text-sm">
              Supervision support des Cash-in/Cash-out agents, de l'OTP au posting Formance.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {operations.totalElements} operations
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard icon={ReceiptText} label="Total filtre" value={operations.totalElements.toString()} />
          <MetricCard icon={CheckCircle2} label="Postees sur cette page" value={pagePosted.toString()} />
          <MetricCard icon={Clock3} label="Preparees sur cette page" value={pagePrepared.toString()} />
          <MetricCard icon={AlertTriangle} label="Echecs sur cette page" value={pageFailed.toString()} />
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Monitoring cash</CardTitle>
          </CardHeader>
          <CardContent>
            <CashOperationsTable filters={filters} operations={operations} pageSize={pageSize} sort={sort} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Operations cash</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger les operations cash.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acces indisponible</CardTitle>
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
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="font-semibold text-2xl">{value}</p>
        </div>
        <Icon className="size-5 text-muted-foreground" />
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
