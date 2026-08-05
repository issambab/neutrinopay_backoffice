import Link from "next/link";

import { FileWarning, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { COMPLIANCE_CASE_STATUSES, COMPLIANCE_RISK_LEVELS } from "@/lib/compliance/compliance.constants";
import { listComplianceCases } from "@/lib/compliance/compliance.server";
import {
  complianceRiskClassName,
  complianceStatusClassName,
  formatComplianceDate,
  formatComplianceEnum,
} from "@/lib/compliance/compliance-format";

type CompliancePageProps = {
  searchParams?: Promise<{
    page?: string;
    ownerType?: string;
    riskLevel?: string;
    size?: string;
    status?: string;
  }>;
};

const PAGE_SIZE = 20;

export default async function CompliancePage({ searchParams }: CompliancePageProps) {
  const params = await searchParams;
  const page = toPageNumber(params?.page);
  const pageSize = toPageSize(params?.size);
  const ownerType = params?.ownerType ?? "";
  const status = params?.status ?? "";
  const riskLevel = params?.riskLevel ?? "";

  try {
    const cases = await listComplianceCases({
      page,
      ownerType: ownerType === "user" || ownerType === "business" ? ownerType : undefined,
      riskLevel,
      size: pageSize,
      status,
    });

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Compliance</h1>
            <p className="text-muted-foreground text-sm">Enquetes internes, escalades et decisions de conformite.</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/merchants">
              <Plus />
              Nouveau depuis marchand
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant={!status && !riskLevel && !ownerType ? "default" : "outline"} size="sm">
            <Link href="/dashboard/compliance">Tous</Link>
          </Button>
          <Button asChild variant={ownerType === "business" ? "default" : "outline"} size="sm">
            <Link href={complianceHref({ ownerType: "business", riskLevel, status })}>Marchands</Link>
          </Button>
          <Button asChild variant={ownerType === "user" ? "default" : "outline"} size="sm">
            <Link href={complianceHref({ ownerType: "user", riskLevel, status })}>Customers</Link>
          </Button>
          {COMPLIANCE_CASE_STATUSES.map((item) => (
            <Button key={item} asChild variant={status === item ? "default" : "outline"} size="sm">
              <Link href={complianceHref({ ownerType, riskLevel, status: item })}>{formatComplianceEnum(item)}</Link>
            </Button>
          ))}
          {COMPLIANCE_RISK_LEVELS.map((item) => (
            <Button key={item} asChild variant={riskLevel === item ? "default" : "outline"} size="sm">
              <Link href={complianceHref({ ownerType, riskLevel: item, status })}>Risque {formatComplianceEnum(item)}</Link>
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Enquetes Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/15">
                  <TableRow>
                    <TableHead className="h-11 p-3">Enquete</TableHead>
                    <TableHead className="h-11 p-3">Proprietaire</TableHead>
                    <TableHead className="h-11 p-3">Risque</TableHead>
                    <TableHead className="h-11 p-3">Statut</TableHead>
                    <TableHead className="h-11 p-3">Ouvert le</TableHead>
                    <TableHead className="h-11 p-3" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.content.length ? (
                    cases.content.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="flex size-8 items-center justify-center rounded-md border bg-muted">
                              <FileWarning className="size-4 text-muted-foreground" />
                            </span>
                            <span className="grid min-w-0 gap-0.5">
                              <span className="truncate font-medium text-sm leading-none">{item.title}</span>
                              <span className="truncate text-muted-foreground text-xs leading-none">
                                {formatComplianceEnum(item.caseType)}
                              </span>
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="p-3 text-sm">
                          <div className="grid gap-0.5">
                            <span>{formatComplianceEnum(item.ownerType)}</span>
                            <span className="text-muted-foreground text-xs">{item.ownerId}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-3">
                          <Badge variant="outline" className={complianceRiskClassName(item.riskLevel)}>
                            {formatComplianceEnum(item.riskLevel)}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-3">
                          <Badge variant="outline" className={complianceStatusClassName(item.status)}>
                            {formatComplianceEnum(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-3 text-sm">{formatComplianceDate(item.openedAt)}</TableCell>
                        <TableCell className="p-3 text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/compliance/${item.id}`}>Voir</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Aucune enquete Compliance trouvee.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex items-center justify-between px-1 text-sm">
              <span className="text-muted-foreground">
                {cases.content.length} ligne(s) affichee(s) sur {cases.totalElements}.
              </span>
              <span className="font-medium">
                Page {cases.page + 1} of {Math.max(cases.totalPages, 1)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance indisponible</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Impossible de charger les enquetes Compliance."}
        </CardContent>
      </Card>
    );
  }
}

function toPageNumber(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function toPageSize(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : PAGE_SIZE;
}

function complianceHref({
  ownerType,
  riskLevel,
  status,
}: {
  ownerType?: string;
  riskLevel?: string;
  status?: string;
}) {
  const searchParams = new URLSearchParams();
  if (ownerType) {
    searchParams.set("ownerType", ownerType);
  }
  if (status) {
    searchParams.set("status", status);
  }
  if (riskLevel) {
    searchParams.set("riskLevel", riskLevel);
  }
  const query = searchParams.toString();
  return query ? `/dashboard/compliance?${query}` : "/dashboard/compliance";
}
