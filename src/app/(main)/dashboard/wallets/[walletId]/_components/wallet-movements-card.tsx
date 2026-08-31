"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { UserWalletTransactionsCard } from "@/app/(main)/dashboard/users/[userId]/_components/user-wallet-transactions-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PageResponse, WalletTransactionResponse } from "@/lib/wallet/wallet.types";

type WalletMovementsCardProps = {
  counterpartyColumn?: boolean;
  description?: string;
  emptyDescription?: string;
  emptyTitle?: string;
  featured?: boolean;
  pageSize: number;
  showMovementStatus?: boolean;
  showCashOperationDetails?: boolean;
  title?: string;
  transactions: PageResponse<WalletTransactionResponse> | null;
};

const PAGE_SIZES = [10, 20, 30, 40, 50];

export function WalletMovementsCard({
  counterpartyColumn,
  description,
  emptyDescription,
  emptyTitle,
  featured,
  pageSize,
  showMovementStatus,
  showCashOperationDetails,
  title,
  transactions,
}: WalletMovementsCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function pushPage(nextPage: number, nextSize = pageSize) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("txPage", String(nextPage));
    nextParams.set("txSize", String(nextSize));
    nextParams.set("txSort", searchParams.get("txSort") ?? "createdAt,desc");
    router.push(`?${nextParams.toString()}`, { scroll: false });
  }

  return (
    <div className="grid gap-3">
      <UserWalletTransactionsCard
        counterpartyColumn={counterpartyColumn}
        description={description}
        emptyDescription={emptyDescription}
        emptyTitle={emptyTitle}
        featured={featured}
        showMovementStatus={showMovementStatus}
        showCashOperationDetails={showCashOperationDetails}
        title={title}
        transactions={transactions?.content ?? null}
      />

      {transactions ? (
        <div className="flex items-center justify-between rounded-md border bg-card px-3 py-2">
          <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
            {transactions.content.length} mouvement(s) affiche(s) sur {transactions.totalElements}.
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:w-fit lg:gap-8">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="wallet-movements-rows-per-page" className="font-medium text-sm">
                Lignes par page
              </Label>
              <Select value={`${pageSize}`} onValueChange={(value) => pushPage(0, Number(value))}>
                <SelectTrigger size="sm" className="w-20" id="wallet-movements-rows-per-page">
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
              Page {transactions.page + 1} sur {Math.max(transactions.totalPages, 1)}
            </div>
            <div className="flex w-full items-center justify-end gap-2 sm:w-fit lg:ml-0">
              <PaginationIconButton disabled={transactions.first} onClick={() => pushPage(0)}>
                <span className="sr-only">Aller a la premiere page</span>
                <ChevronsLeft className="size-4" />
              </PaginationIconButton>
              <PaginationIconButton disabled={transactions.first} onClick={() => pushPage(transactions.page - 1)}>
                <span className="sr-only">Page precedente</span>
                <ChevronLeft className="size-4" />
              </PaginationIconButton>
              <PaginationIconButton disabled={transactions.last} onClick={() => pushPage(transactions.page + 1)}>
                <span className="sr-only">Page suivante</span>
                <ChevronRight className="size-4" />
              </PaginationIconButton>
              <PaginationIconButton
                disabled={transactions.last}
                onClick={() => pushPage(Math.max(transactions.totalPages - 1, 0))}
              >
                <span className="sr-only">Aller a la derniere page</span>
                <ChevronsRight className="size-4" />
              </PaginationIconButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
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
    <Button disabled={disabled} onClick={onClick} size="icon-sm" variant="outline">
      {children}
    </Button>
  );
}
