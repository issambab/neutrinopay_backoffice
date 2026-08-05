import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { MerchantWizard } from "../_components/merchant-wizard";

export default function NewMerchantPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Nouveau marchand</h1>
          <p className="text-muted-foreground text-sm">
            Creez le marchand, ses stations, ses points de vente, puis affectez les terminaux.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/merchants">
            <ArrowLeft />
            Retour
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Onboarding guide</CardTitle>
        </CardHeader>
        <CardContent>
          <MerchantWizard />
        </CardContent>
      </Card>
    </div>
  );
}
