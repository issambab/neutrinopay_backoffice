"use client";

import { useState } from "react";

import Link from "next/link";

import { Eye, ReceiptText } from "lucide-react";

import { CommerceOrderDetail } from "@/components/commerce/commerce-order-detail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CommerceOrderResponse } from "@/lib/commerce/commerce.types";
import {
  formatMoney,
  formatOrderPaymentMethod,
  formatPaymentStatus,
  paymentStatusClassName,
} from "@/lib/commerce/commerce-format";

type MerchantRecentSalesCardProps = {
  orders: CommerceOrderResponse[];
  total: number;
};

export function MerchantRecentSalesCard({ orders, total }: MerchantRecentSalesCardProps) {
  const [selectedOrder, setSelectedOrder] = useState<CommerceOrderResponse | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 border-b sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="size-5 text-primary" />
            Dernieres ventes
          </CardTitle>
          <p className="mt-1 text-muted-foreground text-sm">
            {total > 0 ? `${total} vente(s) payee(s) dans la boutique.` : "Aucune vente payee pour le moment."}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/merchant/sales">Voir toutes</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="rounded-md border border-dashed p-5 text-center text-muted-foreground text-sm">
            Les ventes POS et boutique apparaitront ici apres paiement.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border bg-background">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead className="w-[96px] text-right">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    className="cursor-pointer"
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedOrder(order);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <TableCell>
                      <div className="grid gap-1">
                        <span className="font-medium text-sm">{order.orderNumber}</span>
                        <span className="text-muted-foreground text-xs">{order.items.length} ligne(s)</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="grid max-w-[220px] gap-1">
                        <span className="truncate text-sm">{order.customerName}</span>
                        <span className="truncate text-muted-foreground text-xs">{order.customerPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{formatOrderPaymentMethod(order.metadata)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={paymentStatusClassName(order.paymentStatus)} variant="outline">
                        {formatPaymentStatus(order.paymentStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(order.totalAmount, order.currency)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">
                      {formatDate(order.updatedAt ?? order.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        aria-label={`Voir le detail de la commande ${order.orderNumber}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <Eye />
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
          }
        }}
        open={Boolean(selectedOrder)}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedOrder?.orderNumber ?? "Detail vente"}</DialogTitle>
            <DialogDescription>Detail client, produits vendus et informations paiement POS.</DialogDescription>
          </DialogHeader>
          {selectedOrder ? (
            <div className="grid max-h-[72vh] gap-4 overflow-y-auto pr-1">
              <CommerceOrderDetail order={selectedOrder} paymentIntentScope="merchant" readonly variant="dialog" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
