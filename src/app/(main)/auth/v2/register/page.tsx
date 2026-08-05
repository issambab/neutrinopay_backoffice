import Link from "next/link";

import { ArrowLeft, MailCheck, ShieldCheck, UserPlus } from "lucide-react";

import LogoNeutrinoCar from "@/components/icon/logo-neutrino-car";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { RegisterForm } from "../../_components/register-form";

export default function RegisterV2() {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f7faf9] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl overflow-hidden rounded-lg border bg-background shadow-sm lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden border-r bg-[#0f2f2b] p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-md bg-white text-[#0f2f2b]">
                <LogoNeutrinoCar className="size-9" />
              </div>
              <div>
                <p className="font-semibold">Neutrino Wallet</p>
                <p className="text-white/65 text-xs">Compte user wallet</p>
              </div>
            </div>

            <div className="space-y-3">
              <Badge className="bg-white/10 text-white hover:bg-white/10" variant="secondary">
                Creation de compte securisee
              </Badge>
              <h1 className="font-semibold text-4xl leading-tight">Ouvrez un compte wallet pret pour KYC.</h1>
              <p className="max-w-sm text-sm text-white/70">
                Le compte client cree son wallet en mode limite, puis passe par verification email, MFA et KYC avant les
                transactions.
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            <TrustStep label="Compte client" status="current" />
            <TrustStep label="Verification email" status="locked" />
            <TrustStep label="KYC et wallet" status="locked" />
          </div>
        </section>

        <section className="flex min-h-[720px] flex-col justify-center p-6 sm:p-10">
          <div className="mx-auto w-full max-w-md space-y-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex size-11 items-center justify-center rounded-md border text-[#0f2f2b]">
                  <LogoNeutrinoCar className="size-8" />
                </div>
                <div>
                  <p className="font-semibold">Neutrino Wallet</p>
                  <p className="text-muted-foreground text-xs">Creation compte</p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="ml-auto">
                <Link href="/auth/v2/login">
                  <ArrowLeft className="size-4" />
                  Login
                </Link>
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex size-12 items-center justify-center rounded-md bg-[#e7f4ef] text-[#0f6b57]">
                <UserPlus className="size-6" />
              </div>
              <div className="space-y-2">
                <h2 className="font-semibold text-3xl tracking-tight">Creer votre compte</h2>
                <p className="text-muted-foreground text-sm">
                  Renseignez vos informations client. Apres creation, un code email sera demande pour activer le compte.
                </p>
              </div>
            </div>

            <div className="rounded-lg border bg-background p-4 shadow-xs">
              <RegisterForm />
            </div>

            <Separator />

            <div className="grid gap-3">
              <div className="flex items-start gap-3 rounded-md border bg-[#f7faf9] p-3">
                <MailCheck className="mt-0.5 size-4 text-[#0f6b57]" />
                <p className="text-muted-foreground text-sm">
                  Le code de verification est envoye juste apres creation du compte.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-md border bg-[#f7faf9] p-3">
                <ShieldCheck className="mt-0.5 size-4 text-[#0f6b57]" />
                <p className="text-muted-foreground text-sm">
                  Les operations wallet restent limitees tant que le KYC customer n'est pas valide.
                </p>
              </div>
            </div>

            <p className="text-center text-muted-foreground text-sm">
              Vous avez deja un compte ?{" "}
              <Link href="/auth/v2/login" className="font-medium text-foreground underline-offset-4 hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function TrustStep({ label, status }: { label: string; status: "current" | "locked" }) {
  const className =
    status === "current"
      ? "border-[#8be3c6]/60 bg-[#8be3c6]/15 text-white"
      : "border-white/10 bg-transparent text-white/55";

  return (
    <div className={`flex items-center justify-between rounded-md border px-3 py-2 ${className}`}>
      <span>{label}</span>
      <span className="font-medium text-xs">{status === "current" ? "Maintenant" : "Apres"}</span>
    </div>
  );
}
