"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type OtpVerificationFormProps = {
  identifier: string;
  mode: "email" | "mfa";
  challengeId?: string;
};

export function OtpVerificationForm({ challengeId, identifier, mode }: OtpVerificationFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setErrorMessage(null);

    if (code.length !== 6) {
      const message = "Code OTP invalide.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setSubmitting(true);
    const response = await fetch(mode === "mfa" ? "/api/auth/mfa/verify" : "/api/accounts/verification/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mode === "mfa" ? { challengeId, code } : { identifier, code }),
    });
    const result = (await response.json().catch(() => null)) as { message?: string; redirectTo?: string } | null;
    setSubmitting(false);

    if (!response.ok) {
      const message = result?.message ?? "Verification echouee.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    toast.success(mode === "mfa" ? "Connexion validee." : "Email verifie.");
    router.replace(mode === "mfa" ? (result?.redirectTo ?? "/dashboard/default") : "/auth/v2/login");
    router.refresh();
  };

  const resend = async () => {
    setErrorMessage(null);

    const response = await fetch(mode === "mfa" ? "/api/auth/mfa/send" : "/api/accounts/verification/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mode === "mfa" ? { challengeId } : { identifier }),
    });
    const result = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      const message = result?.message ?? "Impossible d'envoyer le code.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    toast.success("Code envoye.");
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <p className="font-medium text-sm">Code a 6 chiffres</p>
        <p className="text-muted-foreground text-sm">
          {mode === "mfa" ? "Confirmez votre connexion." : `Nous avons envoye un code a ${identifier}.`}
        </p>
      </div>
      <InputOTP maxLength={6} value={code} onChange={setCode} containerClassName="justify-center">
        <InputOTPGroup>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <InputOTPSlot key={index} index={index} className="size-11 text-base" />
          ))}
        </InputOTPGroup>
      </InputOTP>
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="button" onClick={submit} disabled={submitting}>
        {submitting ? "Verification..." : "Valider"}
      </Button>
      <Button type="button" variant="ghost" onClick={resend}>
        Renvoyer le code
      </Button>
    </div>
  );
}
