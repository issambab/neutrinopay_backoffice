import Link from "next/link";

import { ArrowLeft, MailCheck, ShieldCheck } from "lucide-react";

import LogoNeutrinoCar from "@/components/icon/logo-neutrino-car";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { OtpVerificationForm } from "../_components/otp-verification-form";

type VerifyEmailPageProps = {
  searchParams: Promise<{ identifier?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { identifier = "" } = await searchParams;

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[#f7faf9] px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border bg-background shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden border-r bg-[#0f2f2b] p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-md bg-white text-[#0f2f2b]">
                <LogoNeutrinoCar className="size-9" />
              </div>
              <div>
                <p className="font-semibold">Neutrino Wallet</p>
                <p className="text-white/65 text-xs">Compte client securise</p>
              </div>
            </div>

            <div className="space-y-3">
              <Badge className="bg-white/10 text-white hover:bg-white/10" variant="secondary">
                Verification email
              </Badge>
              <h1 className="font-semibold text-4xl leading-tight">Confirmez que ce compte vous appartient.</h1>
              <p className="max-w-sm text-sm text-white/70">
                Cette etape active la protection MFA email et prepare votre dossier wallet avant KYC et transactions.
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            <TrustStep label="Compte cree" status="ok" />
            <TrustStep label="Email a verifier" status="current" />
            <TrustStep label="Wallet en mode limite" status="locked" />
          </div>
        </section>

        <section className="flex min-h-[620px] flex-col justify-center p-6 sm:p-10">
          <div className="mx-auto w-full max-w-md space-y-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex size-11 items-center justify-center rounded-md border text-[#0f2f2b]">
                  <LogoNeutrinoCar className="size-8" />
                </div>
                <div>
                  <p className="font-semibold">Neutrino Wallet</p>
                  <p className="text-muted-foreground text-xs">Compte client</p>
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
                <MailCheck className="size-6" />
              </div>
              <div className="space-y-2">
                <h2 className="font-semibold text-3xl tracking-tight">Verifier votre email</h2>
                <p className="text-muted-foreground text-sm">
                  Entrez le code a 6 chiffres genere apres la creation de votre compte.
                </p>
              </div>
            </div>

            {identifier ? (
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="text-muted-foreground text-xs">Adresse de verification</p>
                <p className="break-all font-medium text-sm">{identifier}</p>
              </div>
            ) : null}

            {identifier ? (
              <OtpVerificationForm identifier={identifier} mode="email" />
            ) : (
              <div className="rounded-md border border-dashed p-4 text-center text-muted-foreground text-sm">
                Email manquant. Retournez a la creation de compte.
              </div>
            )}

            <Separator />

            <div className="flex items-start gap-3 rounded-md border bg-[#f7faf9] p-3">
              <ShieldCheck className="mt-0.5 size-4 text-[#0f6b57]" />
              <p className="text-muted-foreground text-sm">
                En local, le code est visible dans les logs du backend Spring Boot sous `otp_challenge_created`.
              </p>
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
        ? "border-[#8be3c6]/60 bg-[#8be3c6]/15 text-white"
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
