import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgency, listAgencyAgents } from "@/lib/cash/cash.server";

import { AgencyWizard } from "../_components/agency-wizard";

type AgencyDetailPageProps = {
  params: Promise<{
    agencyId: string;
  }>;
};

export default async function AgencyDetailPage({ params }: AgencyDetailPageProps) {
  const { agencyId } = await params;

  try {
    const [agency, contracts] = await Promise.all([
      getAgency(agencyId),
      listAgencyAgents(agencyId, { size: 100, sort: "createdAt,desc" }),
    ]);

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">{agency.name}</h1>
            <p className="text-muted-foreground text-sm">
              Modifiez les informations agence, puis creez ou ajustez ses agents cash.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/agencies">
              <ArrowLeft />
              Retour
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Gestion agence</CardTitle>
          </CardHeader>
          <CardContent>
            <AgencyWizard contracts={contracts.content} initialAgency={agency} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Agence cash</h1>
          <p className="text-muted-foreground text-sm">Impossible de charger l'agence.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acces indisponible</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Le backend agence ne repond pas."}
          </CardContent>
        </Card>
      </div>
    );
  }
}
