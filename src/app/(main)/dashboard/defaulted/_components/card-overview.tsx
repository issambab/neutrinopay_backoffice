"use client";

import { addDays, format } from "date-fns";
import { Home, Receipt, Sparkles, Zap } from "lucide-react";
import { siApple, siMastercard } from "simple-icons";

import LogoNeutrinoCar from "@/components/icon/logo-neutrino-car";
import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

import { QuickActions } from "./quick-actions";

const now = new Date();

const upcomingPayments = [
  {
    id: 1,
    icon: Home,
    title: "Apartment Rent",
    amount: 1200,
    date: `Due on ${format(addDays(now, 2), "do MMMM yyyy")}`,
  },
  {
    id: 2,
    icon: Zap,
    title: "Electricity Bill",
    amount: 75,
    date: `Due on ${format(addDays(now, 2), "do MMMM yyyy")}`,
  },
  {
    id: 3,
    icon: Sparkles,
    title: "ChatGPT Plus",
    amount: 20,
    date: `Due on ${format(addDays(now, 7), "do MMMM yyyy")}`,
  },
  {
    id: 4,
    icon: Receipt,
    title: "Credit Card Payment",
    amount: 420,
    date: `Due on ${format(addDays(now, 9), "do MMMM yyyy")}`,
  },
];

export function CardOverview() {
  return (
    <Card className="shadow-xs">
      <CardHeader className="items-center">
        <CardTitle>My Wallet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid w-full place-items-center">
            <div className="relative flex aspect-8/5 w-full max-w-100 flex-col justify-between overflow-hidden rounded-xl bg-primary p-6">
              <div className="flex items-start justify-between">
                <LogoNeutrinoCar className="text-white size-5 fill-primary-foreground sm:size-8" />
              </div>

              <div className="space-y-1">
                <p className="font-mono text-primary-foreground/90 text-sm tracking-[0.15em] sm:text-lg">
                  5.000 DT / 1 000,000 TND
                </p>
              </div>

              <div className="flex items-end justify-between">
                <div className="space-y-2">
                  <p className="font-medium font-mono text-primary-foreground text-sm uppercase tracking-wide">
                    Issam Babchia
                  </p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[10px] text-primary-foreground/80 uppercase tracking-wider">Niveau</p>
                      <p className="font-mono text-primary-foreground/80 text-xs">1</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-primary-foreground/80 uppercase tracking-wider">kyc</p>
                      <div className="m-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                    </div>
                  </div>
                </div>
                <SimpleIcon icon={siMastercard} className="size-7 fill-primary-foreground/80 sm:size-10" />
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium tabular-nums">issam.babchia@neutrino.com.eu</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Téléphone </span>
              <span className="font-medium tabular-nums">20 721 843</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Level </span>
              <span className="font-medium tabular-nums">Niveau 1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Solde</span>
              <span className="font-medium tabular-nums">5000,000 DT / 1 000,000 TND</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Émis aujourd'hui :</span>
              <span className="font-medium tabular-nums">0,000 TND / 500,000 TND</span>
            </div>
          </div>

          <Separator />
          <QuickActions />
        </div>
      </CardContent>
    </Card>
  );
}
