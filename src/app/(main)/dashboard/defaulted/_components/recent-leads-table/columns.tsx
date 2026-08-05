"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { RecentLeadRow } from "./schema";

const STATUS_BADGE_CLASSNAMES: Record<string, string> = {
  paid: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  refunded: "bg-violet-100 text-violet-800 border-violet-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  chargeback: "bg-rose-100 text-rose-800 border-rose-200",
};

export const recentLeadsColumns: ColumnDef<RecentLeadRow>[] = [
  {
    accessorKey: "ref",
    header: "Ref",
    cell: ({ row }) => {
      const isUp = row.original.direction !== "down";

      return (
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          {isUp ? (
            <ArrowUpRight className="size-4 text-green-600" />
          ) : (
            <ArrowDownRight className="size-4 text-red-600" />
          )}
          {row.original.ref}
        </span>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "party",
    header: "Expéditeur / déstinataire",
    cell: ({ row }) => row.original.party,
    enableHiding: false,
  },
  {
    accessorKey: "amount",
    header: "Montant",
    cell: ({ row }) => row.original.amount,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const statusClassName = STATUS_BADGE_CLASSNAMES[status.toLowerCase()] ?? "bg-muted text-foreground border-border";

      return (
        <Badge variant="outline" className={statusClassName}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.original.date}</span>,
  },
];
