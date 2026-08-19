"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  ArrowDownLeft,
  ArrowDownUp,
  ArrowUpDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Send,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type {
  AgencyResponse,
  AgentSettlementDirection,
  AgentSettlementResponse,
  AgentSettlementStatus,
  CashAgentContractResponse,
  PageResponse,
} from "@/lib/cash/cash.types";
import {
  cashStatusClassName,
  formatAgentSettlementDirection,
  formatCashStatus,
  formatMinorAmount,
} from "@/lib/cash/cash-format";
import { cn } from "@/lib/utils";

type SettlementFilters = {
  agencyId: string;
  agentUserId: string;
  direction: string;
  q: string;
  settlementId: string;
  status: string;
};

type AgentSettlementsPanelProps = {
  agencies: AgencyResponse[];
  contractsByAgencyId: Record<string, CashAgentContractResponse[]>;
  filters: SettlementFilters;
  pageSize: number;
  selectedSettlement: AgentSettlementResponse | null;
  settlements: PageResponse<AgentSettlementResponse>;
  sort: string;
};

const PAGE_SIZES = [10, 20, 30, 40, 50];
const SETTLEMENT_STATUSES: AgentSettlementStatus[] = ["pending", "posted", "failed", "rejected"];
const SETTLEMENT_DIRECTIONS: AgentSettlementDirection[] = ["cash_to_float", "float_to_cash"];

export function AgentSettlementsPanel({
  agencies,
  contractsByAgencyId,
  filters,
  pageSize,
  selectedSettlement,
  settlements,
  sort,
}: AgentSettlementsPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(filters.q);

  useEffect(() => {
    setSearchValue(filters.q);
  }, [filters.q]);

  const allContracts = useMemo(() => Object.values(contractsByAgencyId).flat(), [contractsByAgencyId]);

  function pushParams(updates: Record<string, string | number | null | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      const text = value == null ? "" : String(value);
      if (text.trim()) {
        params.set(key, text.trim());
      } else {
        params.delete(key);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  }

  function pushFilters(nextFilters: Partial<SettlementFilters>, nextPage = 0, nextSize = pageSize) {
    pushParams({
      agencyId: nextFilters.agencyId ?? filters.agencyId,
      agentUserId: nextFilters.agentUserId ?? filters.agentUserId,
      direction: nextFilters.direction ?? filters.direction,
      page: nextPage,
      q: nextFilters.q ?? filters.q,
      settlementId: nextFilters.settlementId ?? filters.settlementId,
      size: nextSize,
      sort,
      status: nextFilters.status ?? filters.status,
    });
  }

  function pushSort(sortKey: string) {
    const [currentKey, currentDirection] = parseSort(sort);
    const nextDirection = currentKey === sortKey && currentDirection === "asc" ? "desc" : "asc";
    pushParams({
      page: 0,
      settlementId: filters.settlementId,
      size: pageSize,
      sort: `${sortKey},${nextDirection}`,
    });
  }

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushFilters({ q: searchValue });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_27rem]">
      <Card>
        <CardHeader className="gap-3 border-b">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>File settlement</CardTitle>
              <p className="mt-1 text-muted-foreground text-sm">Controle finance avant posting ledger.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button asChild variant="outline" size="sm">
                <a href="/dashboard/agent-settlements">
                  <RotateCcw />
                  Reset
                </a>
              </Button>
              <Button disabled size="sm" variant="outline">
                <ArrowUpDown />
                {formatSortLabel(sort)}
              </Button>
            </div>
          </div>
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_170px_170px_220px]">
            <form onSubmit={onSearchSubmit} className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pr-16 pl-8"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Preuve, agent, ledger..."
                value={searchValue}
              />
              <Button
                className="absolute top-1/2 right-1 h-6 -translate-y-1/2 px-2"
                size="sm"
                type="submit"
                variant="ghost"
              >
                OK
              </Button>
            </form>
            <NativeSelect
              className="h-8"
              onChange={(event) => pushFilters({ status: event.target.value })}
              value={filters.status}
            >
              <NativeSelectOption value="">Tous statuts</NativeSelectOption>
              {SETTLEMENT_STATUSES.map((status) => (
                <NativeSelectOption key={status} value={status}>
                  {formatCashStatus(status)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect
              className="h-8"
              onChange={(event) => pushFilters({ direction: event.target.value })}
              value={filters.direction}
            >
              <NativeSelectOption value="">Toutes directions</NativeSelectOption>
              {SETTLEMENT_DIRECTIONS.map((direction) => (
                <NativeSelectOption key={direction} value={direction}>
                  {formatAgentSettlementDirection(direction)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect
              className="h-8"
              onChange={(event) => pushFilters({ agencyId: event.target.value, agentUserId: "", settlementId: "" })}
              value={filters.agencyId}
            >
              <NativeSelectOption value="">Toutes agences</NativeSelectOption>
              {agencies.map((agency) => (
                <NativeSelectOption key={agency.id} value={agency.id}>
                  {agency.agencyCode} - {agency.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettlementTable
            onSelect={(settlementId) => pushFilters({ settlementId }, settlements.page)}
            onSort={pushSort}
            selectedSettlementId={selectedSettlement?.id ?? ""}
            settlements={settlements}
            sort={sort}
          />
          <PaginationBar
            onPageChange={(nextPage) => pushFilters({}, nextPage)}
            onPageSizeChange={(nextSize) => pushFilters({}, 0, nextSize)}
            pageSize={pageSize}
            settlements={settlements}
          />
        </CardContent>
      </Card>

      <div className="grid h-fit gap-4">
        <CreateSettlementCard agencies={agencies} contractsByAgencyId={contractsByAgencyId} />
        <SettlementDetailCard contracts={allContracts} selectedSettlement={selectedSettlement} />
      </div>
    </div>
  );
}

function SettlementTable({
  onSelect,
  onSort,
  selectedSettlementId,
  settlements,
  sort,
}: {
  onSelect: (settlementId: string) => void;
  onSort: (sortKey: string) => void;
  selectedSettlementId: string;
  settlements: PageResponse<AgentSettlementResponse>;
  sort: string;
}) {
  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <Table>
        <TableHeader className="bg-muted/15">
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>
              <SortableHeader currentSort={sort} label="Direction" onSort={onSort} sortKey="direction" />
            </TableHead>
            <TableHead>
              <SortableHeader currentSort={sort} label="Statut" onSort={onSort} sortKey="status" />
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader currentSort={sort} label="Montant" onSort={onSort} sortKey="amountMinor" />
            </TableHead>
            <TableHead>Preuve</TableHead>
            <TableHead>Ledger</TableHead>
            <TableHead className="w-[88px] text-right">Detail</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settlements.content.length ? (
            settlements.content.map((settlement) => (
              <TableRow key={settlement.id} className={cn(settlement.id === selectedSettlementId && "bg-muted/35")}>
                <TableCell>
                  <div className="grid gap-1">
                    <span className="font-medium text-sm">{settlement.agentName ?? "Agent cash"}</span>
                    <span className="font-mono text-muted-foreground text-xs">{settlement.agencyCode}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{formatAgentSettlementDirection(settlement.direction)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn("px-1.5", cashStatusClassName(settlement.status))} variant="outline">
                    {formatCashStatus(settlement.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatMinorAmount(settlement.amountMinor, settlement.currency)}
                </TableCell>
                <TableCell className="font-mono text-muted-foreground text-xs">
                  {settlement.proofReference || "-"}
                </TableCell>
                <TableCell>
                  <div className="grid gap-1">
                    <span className="font-mono text-muted-foreground text-xs">
                      {settlement.ledgerTransactionId ? shortId(settlement.ledgerTransactionId) : "-"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {settlement.postedAt ? formatDateTime(settlement.postedAt) : "Non poste"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <SettlementTransactionDetailSheet onOpen={() => onSelect(settlement.id)} settlement={settlement} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Aucun settlement ne correspond aux filtres.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function SettlementTransactionDetailSheet({
  onOpen,
  settlement,
}: {
  onOpen: () => void;
  settlement: AgentSettlementResponse;
}) {
  const metadataEntries = Object.entries(settlement.metadata ?? {});

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" onClick={onOpen}>
          <Eye />
          Voir
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Detail transaction settlement</SheetTitle>
          <SheetDescription>
            {settlement.proofReference ?? settlement.ledgerTransactionId ?? settlement.id}
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-4 pb-4">
          <div className="grid gap-3 rounded-md border bg-muted/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SettlementDirectionBadge direction={settlement.direction} status={settlement.status} />
              <span className="font-semibold text-lg">{formatSettlementSignedAmount(settlement)}</span>
            </div>
            <Separator />
            <div className="grid gap-3 md:grid-cols-2">
              <DetailFact label="Operation" value={formatAgentSettlementDirection(settlement.direction)} />
              <DetailFact label="Statut" value={formatCashStatus(settlement.status)} />
              <DetailFact label="Settlement" value={settlement.id} mono />
              <DetailFact label="Ledger transaction" value={settlement.ledgerTransactionId ?? "-"} mono />
              <DetailFact label="Preuve" value={settlement.proofReference ?? "-"} mono />
              <DetailFact label="Date creation" value={formatDateTime(settlement.createdAt)} />
              <DetailFact
                label="Date posting"
                value={settlement.postedAt ? formatDateTime(settlement.postedAt) : "-"}
              />
              <DetailFact label="Cle idempotence" value={settlement.idempotencyKey ?? "-"} mono />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Mouvement ledger</h3>
              <Badge variant="outline" className="font-mono text-[11px] text-muted-foreground">
                {settlement.ledgerTransactionId ? shortId(settlement.ledgerTransactionId) : "non poste"}
              </Badge>
            </div>
            <div className="grid gap-3 rounded-md border bg-background p-3">
              <div className="grid gap-3 md:grid-cols-2">
                <DetailFact label="Compte source" value={settlement.sourceAccount} mono />
                <DetailFact label="Compte destination" value={settlement.destinationAccount} mono />
                <DetailFact label="Agence" value={settlement.agencyCode} />
                <DetailFact label="Agent" value={settlement.agentName ?? settlement.agentUserId} />
                <DetailFact label="Contrat agent" value={settlement.agentContractId} mono />
                <DetailFact label="Tenant" value={settlement.tenantId} mono />
              </div>
              {settlement.failureReason ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
                  {settlement.failureReason}
                </div>
              ) : null}
              {settlement.rejectionReason ? (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-amber-800 text-sm dark:text-amber-200">
                  {settlement.rejectionReason}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Metadata settlement / ledger</h3>
              <Badge variant="outline" className="text-muted-foreground">
                {metadataEntries.length} champs
              </Badge>
            </div>
            {metadataEntries.length ? (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableBody>
                    {metadataEntries.map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="w-[180px] align-top font-mono text-muted-foreground text-xs">
                          {key}
                        </TableCell>
                        <TableCell className="whitespace-normal break-all text-sm">
                          {formatMetadataValue(value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
                Aucune metadata disponible pour ce settlement.
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <h3 className="font-medium text-sm">Payload settlement</h3>
            <pre className="max-h-72 overflow-auto rounded-md border bg-muted/20 p-3 text-xs">
              {JSON.stringify(settlement, null, 2)}
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CreateSettlementCard({
  agencies,
  contractsByAgencyId,
}: {
  agencies: AgencyResponse[];
  contractsByAgencyId: Record<string, CashAgentContractResponse[]>;
}) {
  const router = useRouter();
  const [agencyId, setAgencyId] = useState(agencies[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const contracts = contractsByAgencyId[agencyId] ?? [];

  useEffect(() => {
    if (!agencyId && agencies[0]?.id) {
      setAgencyId(agencies[0].id);
    }
  }, [agencies, agencyId]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const amountMinor = dinarToMinor(formData.get("amount"));

    if (!amountMinor || amountMinor <= 0) {
      setError("Le montant doit etre strictement positif.");
      return;
    }

    const payload = {
      agentContractId: String(formData.get("agentContractId") ?? ""),
      amountMinor,
      currency: "TND",
      direction: String(formData.get("direction") ?? "cash_to_float") as AgentSettlementDirection,
      metadata: {
        channel: "backoffice",
      },
      proofReference: nullableText(formData.get("proofReference")),
      reason: nullableText(formData.get("reason")),
    };

    startTransition(async () => {
      const response = await fetch("/api/cash/agent-settlements", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(body?.message ?? "Impossible de creer le settlement.");
        return;
      }

      form.reset();
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Plus className="size-5" />
          Nouveau settlement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="settlementAgency">Agence</Label>
            <NativeSelect id="settlementAgency" value={agencyId} onChange={(event) => setAgencyId(event.target.value)}>
              {agencies.map((agency) => (
                <NativeSelectOption key={agency.id} value={agency.id}>
                  {agency.agencyCode} - {agency.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agentContractId">Agent</Label>
            <NativeSelect id="agentContractId" name="agentContractId" required>
              <NativeSelectOption value="">Selectionner un contrat</NativeSelectOption>
              {contracts.map((contract) => (
                <NativeSelectOption key={contract.id} value={contract.id}>
                  {contract.agentName ?? contract.agentEmail ?? contract.id}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="direction">Direction</Label>
            <NativeSelect id="direction" name="direction" required>
              <NativeSelectOption value="cash_to_float">Cash to Float</NativeSelectOption>
              <NativeSelectOption value="float_to_cash">Float to Cash</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Montant TND</Label>
            <Input id="amount" name="amount" inputMode="decimal" placeholder="5000.000" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="proofReference">Reference preuve</Label>
            <Input id="proofReference" name="proofReference" placeholder="SETTLE-AG-001" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">Motif</Label>
            <Textarea id="reason" name="reason" rows={3} placeholder="Settlement valide par finance" />
          </div>
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive text-sm">
              {error}
            </p>
          ) : null}
          <Button disabled={isPending || contracts.length === 0} type="submit">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Creer pending
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SettlementDetailCard({
  contracts,
  selectedSettlement,
}: {
  contracts: CashAgentContractResponse[];
  selectedSettlement: AgentSettlementResponse | null;
}) {
  const contract = selectedSettlement ? contracts.find((item) => item.id === selectedSettlement.agentContractId) : null;

  if (!selectedSettlement) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Detail</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">Aucun settlement selectionne.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Decision finance</CardTitle>
            <p className="mt-1 font-mono text-muted-foreground text-xs">{shortId(selectedSettlement.id)}</p>
          </div>
          <Badge className={cn("px-1.5", cashStatusClassName(selectedSettlement.status))} variant="outline">
            {formatCashStatus(selectedSettlement.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 text-sm">
          <DetailLine
            label="Agent"
            value={selectedSettlement.agentName ?? contract?.agentEmail ?? selectedSettlement.agentUserId}
          />
          <DetailLine label="Agence" value={selectedSettlement.agencyCode} />
          <DetailLine label="Direction" value={formatAgentSettlementDirection(selectedSettlement.direction)} />
          <DetailLine
            label="Montant"
            value={formatMinorAmount(selectedSettlement.amountMinor, selectedSettlement.currency)}
          />
          <DetailLine label="Preuve" value={selectedSettlement.proofReference || "-"} />
          <DetailLine label="Source" value={selectedSettlement.sourceAccount} mono />
          <DetailLine label="Destination" value={selectedSettlement.destinationAccount} mono />
          <DetailLine label="Ledger" value={selectedSettlement.ledgerTransactionId || "-"} mono />
          <DetailLine label="Creation" value={formatDateTime(selectedSettlement.createdAt)} />
          {selectedSettlement.postedAt ? (
            <DetailLine label="Posting" value={formatDateTime(selectedSettlement.postedAt)} />
          ) : null}
          {selectedSettlement.failedAt ? (
            <DetailLine label="Echec" value={formatDateTime(selectedSettlement.failedAt)} />
          ) : null}
          {selectedSettlement.rejectedAt ? (
            <DetailLine label="Rejet" value={formatDateTime(selectedSettlement.rejectedAt)} />
          ) : null}
          {selectedSettlement.failureReason ? (
            <DetailLine label="Erreur" value={selectedSettlement.failureReason} />
          ) : null}
          {selectedSettlement.rejectionReason ? (
            <DetailLine label="Motif rejet" value={selectedSettlement.rejectionReason} />
          ) : null}
          {selectedSettlement.reason ? <DetailLine label="Motif" value={selectedSettlement.reason} /> : null}
        </div>

        {selectedSettlement.status === "pending" || selectedSettlement.status === "failed" ? (
          <>
            <Separator />
            <ApproveSettlementForm settlement={selectedSettlement} />
          </>
        ) : null}
        {selectedSettlement.status === "pending" ? (
          <>
            <Separator />
            <RejectSettlementForm settlement={selectedSettlement} />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ApproveSettlementForm({ settlement }: { settlement: AgentSettlementResponse }) {
  const router = useRouter();
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIdempotencyKey(`agent-settlement-${settlement.id}-${Date.now()}`);
  }, [settlement.id]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/cash/agent-settlements/${settlement.id}/approve`, {
        body: JSON.stringify({ idempotencyKey }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(body?.message ?? "Impossible d'approuver le settlement.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="idempotencyKey">Cle d'idempotence</Label>
        <Input
          id="idempotencyKey"
          onChange={(event) => setIdempotencyKey(event.target.value)}
          value={idempotencyKey}
          required
        />
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button disabled={isPending || !idempotencyKey.trim()} type="submit">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Accepter et poster
      </Button>
    </form>
  );
}

function RejectSettlementForm({ settlement }: { settlement: AgentSettlementResponse }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const reason = nullableText(formData.get("rejectReason"));

    if (!reason) {
      setError("Le motif de rejet est obligatoire.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/cash/agent-settlements/${settlement.id}/reject`, {
        body: JSON.stringify({ reason }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(body?.message ?? "Impossible de rejeter le settlement.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="rejectReason">Motif de rejet</Label>
        <Textarea id="rejectReason" name="rejectReason" rows={3} required />
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button disabled={isPending} type="submit" variant="outline">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
        Refuser
      </Button>
    </form>
  );
}

function PaginationBar({
  onPageChange,
  onPageSizeChange,
  pageSize,
  settlements,
}: {
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSize: number;
  settlements: PageResponse<AgentSettlementResponse>;
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
        {settlements.content.length} ligne(s) affichee(s) sur {settlements.totalElements}.
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="settlements-rows-per-page" className="font-medium text-sm">
            Rows per page
          </Label>
          <Select value={`${pageSize}`} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger size="sm" className="w-20" id="settlements-rows-per-page">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectGroup>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center font-medium text-sm">
          Page {settlements.page + 1} of {Math.max(settlements.totalPages, 1)}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <PaginationIconButton disabled={settlements.first} onClick={() => onPageChange(0)}>
            <span className="sr-only">Aller a la premiere page</span>
            <ChevronsLeft className="size-4" />
          </PaginationIconButton>
          <PaginationIconButton
            disabled={settlements.first}
            onClick={() => onPageChange(Math.max(settlements.page - 1, 0))}
          >
            <span className="sr-only">Aller a la page precedente</span>
            <ChevronLeft className="size-4" />
          </PaginationIconButton>
          <PaginationIconButton disabled={settlements.last} onClick={() => onPageChange(settlements.page + 1)}>
            <span className="sr-only">Aller a la page suivante</span>
            <ChevronRight className="size-4" />
          </PaginationIconButton>
          <PaginationIconButton
            disabled={settlements.last}
            onClick={() => onPageChange(Math.max(settlements.totalPages - 1, 0))}
          >
            <span className="sr-only">Aller a la derniere page</span>
            <ChevronsRight className="size-4" />
          </PaginationIconButton>
        </div>
      </div>
    </div>
  );
}

function SortableHeader({
  currentSort,
  label,
  onSort,
  sortKey,
}: {
  currentSort: string;
  label: string;
  onSort: (sortKey: string) => void;
  sortKey: string;
}) {
  const [currentKey] = parseSort(currentSort);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 h-7 px-2 font-medium"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <ArrowDownUp className={cn("size-3.5", currentKey === sortKey ? "text-foreground" : "text-muted-foreground")} />
    </Button>
  );
}

function PaginationIconButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="outline" className="size-8" size="icon" onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
}

function DetailLine({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn("break-words", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}

function DetailFact({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn("break-all text-sm", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}

function SettlementDirectionBadge({
  direction,
  status,
}: {
  direction: AgentSettlementDirection;
  status: AgentSettlementStatus;
}) {
  const isFloatIncrease = direction === "cash_to_float";
  const Icon = isFloatIncrease ? ArrowDownLeft : ArrowUpRight;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        isFloatIncrease && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        !isFloatIncrease && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      )}
    >
      <Icon className="size-3" />
      {formatAgentSettlementDirection(direction)}
      <span className="text-muted-foreground">/</span>
      {formatCashStatus(status)}
    </Badge>
  );
}

function formatSettlementSignedAmount(settlement: AgentSettlementResponse) {
  const sign = settlement.direction === "float_to_cash" ? "-" : "+";

  return `${sign}${formatMinorAmount(settlement.amountMinor, settlement.currency)}`;
}

function formatMetadataValue(value: unknown) {
  if (value == null) {
    return "-";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function parseSort(sort: string) {
  const [key = "createdAt", direction = "desc"] = sort.split(",");
  return [key, direction] as const;
}

function formatSortLabel(sort: string) {
  const [key, direction] = parseSort(sort);
  const label =
    {
      amountMinor: "Montant",
      createdAt: "Creation",
      direction: "Direction",
      postedAt: "Posting",
      status: "Statut",
    }[key] ?? "Creation";

  return `${label}, ${direction === "asc" ? "asc" : "desc"}`;
}

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function dinarToMinor(value: FormDataEntryValue | null) {
  const text = String(value ?? "")
    .replace(",", ".")
    .trim();
  if (!text) {
    return null;
  }

  const amount = Number(text);
  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount * 100);
}

function shortId(value: string) {
  return value.length > 13 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
