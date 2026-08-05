import Link from "next/link";

import { ArrowLeft, LockKeyhole, ShieldCheck, TimerReset } from "lucide-react";

import LogoNeutrinoCar from "@/components/icon/logo-neutrino-car";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { OtpVerificationForm } from "../_components/otp-verification-form";

type MfaPageProps = {
  searchParams: Promise<{ challengeId?: string; identifier?: string }>;
};

export default async function MfaPage({ searchParams }: MfaPageProps) {
  const { challengeId = "", identifier = "" } = await searchParams;

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[#f7faf9] px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border bg-background shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden border-r bg-[#12233f] p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-md bg-white text-[#12233f]">
                <LogoNeutrinoCar className="size-9" />
              </div>
              <div>
                <p className="font-semibold">Neutrino Wallet</p>
                <p className="text-white/65 text-xs">Connexion protegee</p>
              </div>
            </div>

            <div className="space-y-3">
              <Badge className="bg-white/10 text-white hover:bg-white/10" variant="secondary">
                MFA email
              </Badge>
              <h1 className="font-semibold text-4xl leading-tight">Une derniere verification avant session active.</h1>
              <p className="max-w-sm text-sm text-white/70">
                Le code MFA evite qu'un mot de passe seul donne acces au wallet et aux donnees KYC.
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            <TrustStep label="Mot de passe valide" status="ok" />
            <TrustStep label="Code MFA requis" status="current" />
            <TrustStep label="Session JWT active" status="locked" />
          </div>
        </section>

        <section className="flex min-h-[620px] flex-col justify-center p-6 sm:p-10">
          <div className="mx-auto w-full max-w-md space-y-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex size-11 items-center justify-center rounded-md border text-[#12233f]">
                  <LogoNeutrinoCar className="size-8" />
                </div>
                <div>
                  <p className="font-semibold">Neutrino Wallet</p>
                  <p className="text-muted-foreground text-xs">Connexion securisee</p>
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
              <div className="flex size-12 items-center justify-center rounded-md bg-[#e9eef8] text-[#254f9a]">
                <LockKeyhole className="size-6" />
              </div>
              <div className="space-y-2">
                <h2 className="font-semibold text-3xl tracking-tight">Verifier la connexion</h2>
                <p className="text-muted-foreground text-sm">
                  Entrez le code a 6 chiffres pour finaliser votre session.
                </p>
              </div>
            </div>

            {identifier ? (
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="text-muted-foreground text-xs">Compte en cours de connexion</p>
                <p className="break-all font-medium text-sm">{identifier}</p>
              </div>
            ) : null}

            {challengeId ? (
              <OtpVerificationForm challengeId={challengeId} identifier={identifier} mode="mfa" />
            ) : (
              <div className="rounded-md border border-dashed p-4 text-center text-muted-foreground text-sm">
                Challenge MFA manquant. Recommencez la connexion.
              </div>
            )}

            <Separator />

            <div className="grid gap-3">
              <div className="flex items-start gap-3 rounded-md border bg-[#f7faf9] p-3">
                <ShieldCheck className="mt-0.5 size-4 text-[#254f9a]" />
                <p className="text-muted-foreground text-sm">
                  Aucun token n'est cree avant validation MFA. La session reste inactive pendant cette etape.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-md border bg-[#f7faf9] p-3">
                <TimerReset className="mt-0.5 size-4 text-[#254f9a]" />
                <p className="text-muted-foreground text-sm">
                  En local, le code MFA est visible dans les logs backend sous `otp_challenge_created usage=login_mfa`.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function TrustStep({ label, status }: { label: string; status: "current" | "locked" | "ok" }) {
  const className =
    status === "ok"
      ? "border-white/20 bg-white/10 text-white"
      : status === "current"
        ? "border-[#a8c7ff]/60 bg-[#a8c7ff]/15 text-white"
        : "border-white/10 bg-transparent text-white/55";

  return (
    <div className={`flex items-center justify-between rounded-md border px-3 py-2 ${className}`}>
      <span>{label}</span>
      <span className="font-medium text-xs">
        {status === "ok" ? "OK" : status === "current" ? "Maintenant" : "Apres"}
      </span>
    </div>
  );
}
