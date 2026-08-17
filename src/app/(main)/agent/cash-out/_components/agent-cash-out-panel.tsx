"use client";

import { useMemo, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { CheckCircle2, Loader2, Search, Send, ShieldCheck, WalletCards } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type {
  CashAgentContractResponse,
  CashCustomerLookupResponse,
  CashOperationResponse,
} from "@/lib/cash/cash.types";
import { cashStatusClassName, formatCashStatus, formatMinorAmount } from "@/lib/cash/cash-format";
import { cn } from "@/lib/utils";

type ApiPayload<T> = {
  message?: string;
} & T;

type AgentCashOutPanelProps = {
  contract: CashAgentContractResponse;
};

type CashOutBreakdown = {
  agentCommissionMinor: number;
  cashToCustomerMinor: number;
  commissionMinor: number;
  platformCommissionMinor: number;
  totalDebitMinor: number;
};

export function AgentCashOutPanel({ contract }: AgentCashOutPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [customerLookup, setCustomerLookup] = useState("");
  const [amount, setAmount] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [customer, setCustomer] = useState<CashCustomerLookupResponse | null>(null);
  const [operation, setOperation] = useState<CashOperationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const amountMinor = useMemo(() => parseTndAmountToMinor(amount), [amount]);
  const estimate = useMemo(() => estimateCashOutBreakdown(amountMinor, contract), [amountMinor, contract]);
  const operationBreakdown = operation ? cashOutBreakdown(operation) : null;
  const canStart = Boolean(customer?.eligibility.eligible && amountMinor && amountMinor > 0);
  const canConfirm = Boolean(operation?.status === "otp_pending" && operation.otpChallengeId && otpCode.trim());
  const canExecute = operation?.status === "prepared";

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(() => {
      action().catch((caughtError: unknown) => {
        setError(caughtError instanceof Error ? caughtError.message : "Operation impossible pour le moment.");
      });
    });
  }

  function searchCustomer() {
    run(async () => {
      const lookup = customerLookup.trim();
      if (!lookup) {
        throw new Error("Saisissez une reference client, un email ou un telephone.");
      }

      const response = await fetch(`/api/agent/customers/search?q=${encodeURIComponent(lookup)}`);
      const payload = (await response.json().catch(() => ({}))) as ApiPayload<{
        customer?: CashCustomerLookupResponse;
      }>;
      if (!response.ok || !payload.customer) {
        throw new Error(payload.message ?? "Client introuvable ou non eligible.");
      }

      setCustomer(payload.customer);
      setOperation(null);
      setOtpCode("");
    });
  }

  function startCashOut() {
    run(async () => {
      if (!amountMinor || amountMinor <= 0) {
        throw new Error("Le montant Cash-out doit etre superieur a zero.");
      }

      const response = await fetch("/api/agent/cash-out", {
        body: JSON.stringify({
          amountMinor,
          currency: "TND",
          customerLookup: customerLookup.trim(),
          metadata: {
            channel: "backoffice-agent-ui",
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as ApiPayload<{
        operation?: CashOperationResponse;
      }>;
      if (!response.ok || !payload.operation) {
        throw new Error(payload.message ?? "Creation Cash-out impossible.");
      }

      setOperation(payload.operation);
      setOtpCode("");
    });
  }

  function confirmOtp() {
    run(async () => {
      if (!operation?.otpChallengeId) {
        throw new Error("Aucun challenge OTP disponible pour cette operation.");
      }

      const response = await fetch(`/api/agent/cash-operations/${operation.id}/confirm`, {
        body: JSON.stringify({
          code: otpCode.trim(),
          otpChallengeId: operation.otpChallengeId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json().catch(() => ({}))) as ApiPayload<{
        operation?: CashOperationResponse;
      }>;
      if (!response.ok || !payload.operation) {
        throw new Error(payload.message ?? "Confirmation OTP refusee.");
      }

      setOperation(payload.operation);
      router.refresh();
    });
  }

  function executeCashOut() {
    run(async () => {
      if (!operation) {
        throw new Error("Aucune operation a poster.");
      }

      const response = await fetch(`/api/agent/cash-operations/${operation.id}/execute`, {
        body: JSON.stringify({
          idempotencyKey: `backoffice-agent-cashout-${operation.id}-${clientIdempotencySuffix()}`,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as ApiPayload<{
        operation?: CashOperationResponse;
      }>;
      if (!response.ok || !payload.operation) {
        throw new Error(payload.message ?? "Posting ledger impossible.");
      }

      setOperation(payload.operation);
    });
  }

  return (
    <Card className="border bg-background shadow-none">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <WalletCards className="size-5" />
          Cash-out client
        </CardTitle>
        <CardDescription>Retrait client avec OTP, controle solde wallet, puis posting Ledger.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="cash-out-customer-lookup">Client</Label>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              id="cash-out-customer-lookup"
              onChange={(event) => setCustomerLookup(event.target.value)}
              placeholder="Email, telephone ou reference"
              value={customerLookup}
            />
            <Button disabled={isPending} onClick={searchCustomer} type="button" variant="secondary">
              {isPending ? <Loader2 className="animate-spin" /> : <Search />}
              Chercher
            </Button>
          </div>
        </div>

        {customer ? <CustomerEligibilityCard customer={customer} /> : null}

        <Separator />

        <div className="grid gap-2">
          <Label htmlFor="cash-out-amount">Cash remis au client</Label>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              id="cash-out-amount"
              inputMode="decimal"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Ex: 25.000"
              value={amount}
            />
            <Button disabled={isPending || !canStart} onClick={startCashOut} type="button">
              {isPending ? <Loader2 className="animate-spin" /> : <Send />}
              Initier
            </Button>
          </div>
        </div>

        <BreakdownCard breakdown={operationBreakdown ?? estimate} source={operation ? "backend" : "estimation"} />

        {operation ? (
          <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">Operation</p>
                <p className="truncate font-medium text-sm">{operation.id}</p>
              </div>
              <Badge className={cashStatusClassName(operation.status)} variant="outline">
                {formatCashStatus(operation.status)}
              </Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                disabled={operation.status !== "otp_pending"}
                inputMode="numeric"
                onChange={(event) => setOtpCode(event.target.value)}
                placeholder="Code OTP"
                value={otpCode}
              />
              <Button disabled={isPending || !canConfirm} onClick={confirmOtp} type="button" variant="secondary">
                {isPending ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                Confirmer
              </Button>
            </div>
            <Button disabled={isPending || !canExecute} onClick={executeCashOut} type="button">
              {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Poster dans Ledger
            </Button>
            {operation.ledgerTransactionId ? (
              <p className="break-all text-muted-foreground text-xs">
                Ledger transaction: {operation.ledgerTransactionId}
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Action refusee</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CustomerEligibilityCard({ customer }: { customer: CashCustomerLookupResponse }) {
  const blockingReasons = customer.eligibility.blockingReasons ?? [];

  return (
    <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">
            {customer.fullName ?? customer.email ?? customer.externalReference}
          </p>
          <p className="truncate text-muted-foreground text-xs">
            {[customer.email, customer.phoneNumber, customer.externalReference].filter(Boolean).join(" Â· ")}
          </p>
        </div>
        <Badge
          className={cn(
            customer.eligibility.eligible
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-orange-200 bg-orange-50 text-orange-700",
          )}
          variant="outline"
        >
          {customer.eligibility.eligible ? "Eligible" : "Bloque"}
        </Badge>
      </div>
      {blockingReasons.length > 0 ? (
        <div className="grid gap-1 text-muted-foreground text-xs">
          {blockingReasons.map((reason) => (
            <p key={reason}>{reason}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BreakdownCard({ breakdown, source }: { breakdown: CashOutBreakdown; source: "backend" | "estimation" }) {
  return (
    <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-sm">Apercu retrait</p>
        <Badge variant="outline">{source === "backend" ? "Calcule backend" : "Estimation contrat"}</Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <BreakdownItem label="Cash remis client" value={formatMinorAmount(breakdown.cashToCustomerMinor)} />
        <BreakdownItem label="Commission totale" value={formatMinorAmount(breakdown.commissionMinor)} />
        <BreakdownItem label="Earnings agent" value={formatMinorAmount(breakdown.agentCommissionMinor)} />
        <BreakdownItem label="Revenu plateforme" value={formatMinorAmount(breakdown.platformCommissionMinor)} />
      </div>
      <div className="rounded-md border bg-background p-3">
        <p className="text-muted-foreground text-xs">Total debite du wallet client</p>
        <p className="font-semibold text-xl">{formatMinorAmount(breakdown.totalDebitMinor)}</p>
      </div>
    </div>
  );
}

function BreakdownItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}

function estimateCashOutBreakdown(amountMinor: number | null, contract: CashAgentContractResponse): CashOutBreakdown {
  const cashToCustomerMinor = amountMinor ?? 0;
  const commissionMinor = commissionMinorFromContract(cashToCustomerMinor, contract);
  const platformCommissionMinor = Math.round((commissionMinor * contract.platformCommissionSharePercent) / 100);
  const agentCommissionMinor = commissionMinor - platformCommissionMinor;

  return {
    agentCommissionMinor,
    cashToCustomerMinor,
    commissionMinor,
    platformCommissionMinor,
    totalDebitMinor: cashToCustomerMinor + commissionMinor,
  };
}

function cashOutBreakdown(operation: CashOperationResponse): CashOutBreakdown {
  const cashToCustomerMinor = operation.grossAmountMinor ?? operation.amountMinor;
  const commissionMinor = operation.commissionAmountMinor ?? 0;
  return {
    agentCommissionMinor: operation.agentCommissionAmountMinor ?? commissionMinor,
    cashToCustomerMinor,
    commissionMinor,
    platformCommissionMinor: operation.platformCommissionAmountMinor ?? 0,
    totalDebitMinor: cashToCustomerMinor + commissionMinor,
  };
}

function commissionMinorFromContract(amountMinor: number, contract: CashAgentContractResponse) {
  if (!amountMinor || contract.commissionValue <= 0) {
    return 0;
  }
  if (contract.commissionMode === "percent") {
    return Math.round((amountMinor * contract.commissionValue) / 100);
  }
  return Math.round(contract.commissionValue);
}

function clientIdempotencySuffix() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const values = new Uint32Array(4);
    crypto.getRandomValues(values);
    return Array.from(values, (value) => value.toString(16).padStart(8, "0")).join("");
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseTndAmountToMinor(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed * 100);
}
