"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  ArrowUpDown,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type {
  AgencyResponse,
  AgentFloatTopupResponse,
  AgentFloatTopupStatus,
  CashAgentContractResponse,
  PageResponse,
} from "@/lib/cash/cash.types";
import { cashStatusClassName, formatCashStatus, formatMinorAmount } from "@/lib/cash/cash-format";
import { cn } from "@/lib/utils";

type TopupFilters = {
  agencyId: string;
  agentUserId: string;
  q: string;
  status: string;
  topupId: string;
};

type AgentFloatTopupsPanelProps = {
  agencies: AgencyResponse[];
  contractsByAgencyId: Record<string, CashAgentContractResponse[]>;
  filters: TopupFilters;
  pageSize: number;
  selectedTopup: AgentFloatTopupResponse | null;
  sort: string;
  topups: PageResponse<AgentFloatTopupResponse>;
};

const PAGE_SIZES = [10, 20, 30, 40, 50];
const TOPUP_STATUSES: AgentFloatTopupStatus[] = ["pending", "posted", "failed", "rejected"];

export function AgentFloatTopupsPanel({
  agencies,
  contractsByAgencyId,
  filters,
  pageSize,
  selectedTopup,
  sort,
  topups,
}: AgentFloatTopupsPanelProps) {
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

  function pushFilters(nextFilters: Partial<TopupFilters>, nextPage = 0, nextSize = pageSize) {
    pushParams({
      agencyId: nextFilters.agencyId ?? filters.agencyId,
      agentUserId: nextFilters.agentUserId ?? filters.agentUserId,
      page: nextPage,
      q: nextFilters.q ?? filters.q,
      size: nextSize,
      sort,
      status: nextFilters.status ?? filters.status,
      topupId: nextFilters.topupId ?? filters.topupId,
    });
  }

  function pushSort(sortKey: string) {
    const [currentKey, currentDirection] = parseSort(sort);
    const nextDirection = currentKey === sortKey && currentDirection === "asc" ? "desc" : "asc";
    pushParams({
      page: 0,
      size: pageSize,
      sort: `${sortKey},${nextDirection}`,
      topupId: filters.topupId,
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
              <CardTitle>File de financement</CardTitle>
              <p className="mt-1 text-muted-foreground text-sm">Creation, controle et decision finance.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button asChild variant="outline" size="sm">
                <a href="/dashboard/agent-float-topups">
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
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_180px_220px]">
            <form onSubmit={onSearchSubmit} className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pr-16 pl-8"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Preuve, transaction ledger..."
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
              {TOPUP_STATUSES.map((status) => (
                <NativeSelectOption key={status} value={status}>
                  {formatCashStatus(status)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect
              className="h-8"
              onChange={(event) => pushFilters({ agencyId: event.target.value, agentUserId: "", topupId: "" })}
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
          <TopupTable
            onSelect={(topupId) => pushFilters({ topupId }, topups.page)}
            onSort={pushSort}
            selectedTopupId={selectedTopup?.id ?? ""}
            sort={sort}
            topups={topups}
          />
          <PaginationBar
            onPageChange={(nextPage) => pushFilters({}, nextPage)}
            onPageSizeChange={(nextSize) => pushFilters({}, 0, nextSize)}
            pageSize={pageSize}
            topups={topups}
          />
        </CardContent>
      </Card>

      <div className="grid h-fit gap-4">
        <CreateTopupCard agencies={agencies} contractsByAgencyId={contractsByAgencyId} />
        <TopupDetailCard contracts={allContracts} selectedTopup={selectedTopup} />
      </div>
    </div>
  );
}

function TopupTable({
  onSelect,
  onSort,
  selectedTopupId,
  sort,
  topups,
}: {
  onSelect: (topupId: string) => void;
  onSort: (sortKey: string) => void;
  selectedTopupId: string;
  sort: string;
  topups: PageResponse<AgentFloatTopupResponse>;
}) {
  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <Table>
        <TableHeader className="bg-muted/15">
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>
              <SortableHeader currentSort={sort} label="Statut" onSort={onSort} sortKey="status" />
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader currentSort={sort} label="Montant" onSort={onSort} sortKey="amountMinor" />
            </TableHead>
            <TableHead>Preuve</TableHead>
            <TableHead>Ledger</TableHead>
            <TableHead className="text-right">
              <SortableHeader currentSort={sort} label="Date" onSort={onSort} sortKey="createdAt" />
            </TableHead>
            <TableHead className="w-[88px] text-right">Detail</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topups.content.length ? (
            topups.content.map((topup) => (
              <TableRow key={topup.id} className={cn(topup.id === selectedTopupId && "bg-muted/35")}>
                <TableCell>
                  <div className="grid gap-1">
                    <span className="font-medium text-sm">{topup.agentName ?? "Agent cash"}</span>
                    <span className="font-mono text-muted-foreground text-xs">{topup.agencyCode}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("px-1.5", cashStatusClassName(topup.status))} variant="outline">
                    {formatCashStatus(topup.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatMinorAmount(topup.amountMinor, topup.currency)}
                </TableCell>
                <TableCell className="font-mono text-muted-foreground text-xs">{topup.proofReference || "-"}</TableCell>
                <TableCell>
                  <div className="grid gap-1">
                    <span className="font-mono text-muted-foreground text-xs">
                      {topup.ledgerTransactionId ? shortId(topup.ledgerTransactionId) : "-"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {topup.postedAt ? formatDateTime(topup.postedAt) : "Non postee"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-xs">
                  {formatDateTime(topup.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onSelect(topup.id)}>
                    <Eye />
                    Voir
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Aucune demande float ne correspond aux filtres.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function CreateTopupCard({
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
      proofReference: nullableText(formData.get("proofReference")),
      reason: nullableText(formData.get("reason")),
      metadata: {
        channel: "backoffice",
      },
    };

    startTransition(async () => {
      const response = await fetch("/api/cash/agent-float-topups", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(body?.message ?? "Impossible de creer la demande.");
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
          Nouvelle demande
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="topupAgency">Agence</Label>
            <NativeSelect id="topupAgency" value={agencyId} onChange={(event) => setAgencyId(event.target.value)}>
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
            <Label htmlFor="amount">Montant TND</Label>
            <Input id="amount" name="amount" inputMode="decimal" placeholder="5000.000" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="proofReference">Reference preuve</Label>
            <Input id="proofReference" name="proofReference" placeholder="DEPOT-AG-001" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">Motif</Label>
            <Textarea id="reason" name="reason" rows={3} placeholder="Depot caisse valide par finance" />
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

function TopupDetailCard({
  contracts,
  selectedTopup,
}: {
  contracts: CashAgentContractResponse[];
  selectedTopup: AgentFloatTopupResponse | null;
}) {
  const contract = selectedTopup ? contracts.find((item) => item.id === selectedTopup.agentContractId) : null;

  if (!selectedTopup) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Detail</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">Aucune demande selectionnee.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Detail demande</CardTitle>
            <p className="mt-1 font-mono text-muted-foreground text-xs">{shortId(selectedTopup.id)}</p>
          </div>
          <Badge className={cn("px-1.5", cashStatusClassName(selectedTopup.status))} variant="outline">
            {formatCashStatus(selectedTopup.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 text-sm">
          <DetailLine
            label="Agent"
            value={selectedTopup.agentName ?? contract?.agentEmail ?? selectedTopup.agentUserId}
          />
          <DetailLine label="Agence" value={selectedTopup.agencyCode} />
          <DetailLine label="Montant" value={formatMinorAmount(selectedTopup.amountMinor, selectedTopup.currency)} />
          <DetailLine label="Preuve" value={selectedTopup.proofReference || "-"} />
          <DetailLine label="Source" value={selectedTopup.sourceAccount} mono />
          <DetailLine label="Destination" value={selectedTopup.destinationAccount} mono />
          <DetailLine label="Ledger" value={selectedTopup.ledgerTransactionId || "-"} mono />
          <DetailLine label="Creation" value={formatDateTime(selectedTopup.createdAt)} />
          {selectedTopup.postedAt ? (
            <DetailLine label="Posting" value={formatDateTime(selectedTopup.postedAt)} />
          ) : null}
          {selectedTopup.failedAt ? <DetailLine label="Echec" value={formatDateTime(selectedTopup.failedAt)} /> : null}
          {selectedTopup.rejectedAt ? (
            <DetailLine label="Rejet" value={formatDateTime(selectedTopup.rejectedAt)} />
          ) : null}
          {selectedTopup.failureReason ? <DetailLine label="Erreur" value={selectedTopup.failureReason} /> : null}
          {selectedTopup.reason ? <DetailLine label="Motif" value={selectedTopup.reason} /> : null}
        </div>

        {selectedTopup.status === "pending" || selectedTopup.status === "failed" ? (
          <>
            <Separator />
            <ApproveTopupForm topup={selectedTopup} />
          </>
        ) : null}
        {selectedTopup.status === "pending" ? (
          <>
            <Separator />
            <RejectTopupForm topup={selectedTopup} />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ApproveTopupForm({ topup }: { topup: AgentFloatTopupResponse }) {
  const router = useRouter();
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIdempotencyKey(`agent-float-${topup.id}-${Date.now()}`);
  }, [topup.id]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/cash/agent-float-topups/${topup.id}/approve`, {
        body: JSON.stringify({ idempotencyKey }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(body?.message ?? "Impossible d'approuver la demande.");
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
        Approuver et poster
      </Button>
    </form>
  );
}

function RejectTopupForm({ topup }: { topup: AgentFloatTopupResponse }) {
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
      const response = await fetch(`/api/cash/agent-float-topups/${topup.id}/reject`, {
        body: JSON.stringify({ reason }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(body?.message ?? "Impossible de rejeter la demande.");
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
        Rejeter
      </Button>
    </form>
  );
}

function PaginationBar({
  onPageChange,
  onPageSizeChange,
  pageSize,
  topups,
}: {
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSize: number;
  topups: PageResponse<AgentFloatTopupResponse>;
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
        {topups.content.length} ligne(s) affichee(s) sur {topups.totalElements}.
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="topups-rows-per-page" className="font-medium text-sm">
            Rows per page
          </Label>
          <Select value={`${pageSize}`} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger size="sm" className="w-20" id="topups-rows-per-page">
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
          Page {topups.page + 1} of {Math.max(topups.totalPages, 1)}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <PaginationIconButton disabled={topups.first} onClick={() => onPageChange(0)}>
            <span className="sr-only">Aller a la premiere page</span>
            <ChevronsLeft className="size-4" />
          </PaginationIconButton>
          <PaginationIconButton disabled={topups.first} onClick={() => onPageChange(Math.max(topups.page - 1, 0))}>
            <span className="sr-only">Aller a la page precedente</span>
            <ChevronLeft className="size-4" />
          </PaginationIconButton>
          <PaginationIconButton disabled={topups.last} onClick={() => onPageChange(topups.page + 1)}>
            <span className="sr-only">Aller a la page suivante</span>
            <ChevronRight className="size-4" />
          </PaginationIconButton>
          <PaginationIconButton disabled={topups.last} onClick={() => onPageChange(Math.max(topups.totalPages - 1, 0))}>
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
      <ArrowUpDown className={cn("size-3.5", currentKey === sortKey ? "text-foreground" : "text-muted-foreground")} />
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
