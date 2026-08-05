import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getComplianceCase, listComplianceCaseTimeline } from "@/lib/compliance/compliance.server";

import { ComplianceCaseDetail } from "./_components/compliance-case-detail";

type ComplianceCasePageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function ComplianceCasePage({ params }: ComplianceCasePageProps) {
  const { caseId } = await params;

  try {
    const [complianceCase, timeline] = await Promise.all([
      getComplianceCase(caseId),
      listComplianceCaseTimeline(caseId),
    ]);

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Dossier Compliance</h1>
            <p className="text-muted-foreground text-sm">Timeline, decisions et actions de conformite.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/compliance">
              <ArrowLeft />
              Retour
            </Link>
          </Button>
        </div>

        <ComplianceCaseDetail complianceCase={complianceCase} timeline={timeline} />
      </div>
    );
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("not found")) {
      notFound();
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance indisponible</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Impossible de charger le dossier Compliance."}
        </CardContent>
      </Card>
    );
  }
}
