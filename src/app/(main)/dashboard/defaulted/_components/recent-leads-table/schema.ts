import z from "zod";

export const recentLeadsSchema = z.object({
  ref: z.string(),
  party: z.string(),
  amount: z.string(),
  status: z.string(),
  type: z.string(),
  date: z.string(),
  direction: z.enum(["up", "down"]).optional(),
});

export type RecentLeadRow = z.infer<typeof recentLeadsSchema>;

const recentLeadsNewStructureSchema = z.object({
  Ref: z.string(),
  "Expéditeur / déstinataire": z.string(),
  Montant: z.string(),
  Status: z.string(),
  Type: z.string(),
  Date: z.string(),
  Direction: z.string().optional(),
});

const recentLeadsInputSchema = z.union([recentLeadsSchema, recentLeadsNewStructureSchema]);

export type RecentLeadInput = z.infer<typeof recentLeadsInputSchema>;

function normalizeDirection(direction: string | "up" | "down" | undefined): "up" | "down" {
  return direction === "down" ? "down" : "up";
}

export function normalizeRecentLeadRow(row: RecentLeadInput): RecentLeadRow {
  if ("ref" in row) {
    return {
      ...row,
      direction: normalizeDirection(row.direction),
    };
  }

  const newStructureRow = recentLeadsNewStructureSchema.parse(row);

  return {
    ref: newStructureRow.Ref,
    party: newStructureRow["Expéditeur / déstinataire"],
    amount: newStructureRow.Montant,
    status: newStructureRow.Status,
    type: newStructureRow.Type,
    date: newStructureRow.Date,
    direction: normalizeDirection(newStructureRow.Direction),
  };
}
