import Link from "next/link";

import { ArrowRight, LockKeyhole } from "lucide-react";

import LogoNeutrinoCar from "@/components/icon/logo-neutrino-car";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { LoginForm } from "../../_components/login-form";

export default function LoginV2() {
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
                <p className="text-white/65 text-xs">Backoffice, marchand et user</p>
              </div>
            </div>

            <div className="space-y-3">
              <Badge className="bg-white/10 text-white hover:bg-white/10" variant="secondary">
                Authentification securisee
              </Badge>
              <h1 className="font-semibold text-4xl leading-tight">Un seul login, un espace adapte a votre role.</h1>
              <p className="max-w-sm text-sm text-white/70">
                Admin, marchand ou user wallet: Neutrino vous redirige vers le bon dashboard apres validation.
              </p>
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-white/8 p-4">
            <p className="font-medium text-sm">Connexion protegee</p>
            <p className="mt-1 text-white/65 text-xs">
              Votre espace est charge automatiquement selon les droits de votre compte.
            </p>
          </div>
        </section>

        <section className="flex min-h-[680px] flex-col justify-center p-6 sm:p-10">
          <div className="mx-auto w-full max-w-md space-y-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex size-11 items-center justify-center rounded-md border text-[#0f2f2b]">
                  <LogoNeutrinoCar className="size-8" />
                </div>
                <div>
                  <p className="font-semibold">Neutrino Wallet</p>
                  <p className="text-muted-foreground text-xs">Connexion securisee</p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="ml-auto">
                <Link href="/auth/v2/register">
                  Creer compte
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex size-12 items-center justify-center rounded-md bg-[#e7f4ef] text-[#0f6b57]">
                <LockKeyhole className="size-6" />
              </div>
              <div className="space-y-2">
                <h2 className="font-semibold text-3xl tracking-tight">Connexion</h2>
                <p className="text-muted-foreground text-sm">
                  Entrez vos identifiants. Si MFA est active, un code email sera demande avant creation de session.
                </p>
              </div>
            </div>

            <div className="rounded-lg border bg-background p-4 shadow-xs">
              <LoginForm />
            </div>

            <p className="text-center text-muted-foreground text-sm">
              Nouveau client wallet ?{" "}
              <Link href="/auth/v2/register" className="font-medium text-foreground underline-offset-4 hover:underline">
                Creer un compte
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
