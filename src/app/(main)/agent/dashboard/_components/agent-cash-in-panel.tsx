"use client";

import { useMemo, useState, useTransition } from "react";

import { CheckCircle2, Loader2, Search, Send, ShieldCheck, WalletCards } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { CashCustomerLookupResponse, CashOperationResponse } from "@/lib/cash/cash.types";
import { cashStatusClassName, formatCashStatus, formatMinorAmount } from "@/lib/cash/cash-format";
import { cn } from "@/lib/utils";

type ApiPayload<T> = {
  message?: string;
} & T;

export function AgentCashInPanel() {
  const [isPending, startTransition] = useTransition();
  const [customerLookup, setCustomerLookup] = useState("");
  const [amount, setAmount] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [customer, setCustomer] = useState<CashCustomerLookupResponse | null>(null);
  const [operation, setOperation] = useState<CashOperationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const amountMinor = useMemo(() => parseTndAmountToMinor(amount), [amount]);
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

  function startCashIn() {
    run(async () => {
      if (!amountMinor || amountMinor <= 0) {
        throw new Error("Le montant Cash-in doit etre superieur a zero.");
      }

      const response = await fetch("/api/agent/cash-in", {
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
        throw new Error(payload.message ?? "Creation Cash-in impossible.");
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
    });
  }

  function executeCashIn() {
    run(async () => {
      if (!operation) {
        throw new Error("Aucune operation a poster.");
      }

      const response = await fetch(`/api/agent/cash-operations/${operation.id}/execute`, {
        body: JSON.stringify({
          idempotencyKey: `backoffice-agent-${operation.id}-${crypto.randomUUID()}`,
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
          Cash-in client
        </CardTitle>
        <CardDescription>Recherche client, OTP, puis posting Formance.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="cash-customer-lookup">Client</Label>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              id="cash-customer-lookup"
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
          <Label htmlFor="cash-in-amount">Montant TND</Label>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              id="cash-in-amount"
              inputMode="decimal"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Ex: 25.000"
              value={amount}
            />
            <Button disabled={isPending || !canStart} onClick={startCashIn} type="button">
              {isPending ? <Loader2 className="animate-spin" /> : <Send />}
              Initier
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Montant prepare: {amountMinor ? formatMinorAmount(amountMinor) : formatMinorAmount(0)}
          </p>
        </div>

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
            <Button disabled={isPending || !canExecute} onClick={executeCashIn} type="button">
              {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Poster dans Formance
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
            {[customer.email, customer.phoneNumber, customer.externalReference].filter(Boolean).join(" · ")}
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
