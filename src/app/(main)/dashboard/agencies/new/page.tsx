import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AgencyWizard } from "../_components/agency-wizard";

export default async function NewAgencyPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Nouvelle agence</h1>
          <p className="text-muted-foreground text-sm">Creez l'agence, puis ajoutez ses agents cash.</p>
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
          <CardTitle>Onboarding agence</CardTitle>
        </CardHeader>
        <CardContent>
          <AgencyWizard contracts={[]} />
        </CardContent>
      </Card>
    </div>
  );
}
