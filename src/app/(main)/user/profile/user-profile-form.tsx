"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { KeyRound, MailCheck, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { CurrentUserResponse } from "@/lib/auth/auth.types";

type UserProfileFormProps = {
  user: CurrentUserResponse["user"];
};

export function UserProfileForm({ user }: UserProfileFormProps) {
  const router = useRouter();
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  async function submitProfile(formData: FormData) {
    setSavingProfile(true);
    const response = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: String(formData.get("fullName") ?? "").trim(),
        phoneNumber: String(formData.get("phoneNumber") ?? "").trim() || null,
      }),
    });
    const result = (await response.json().catch(() => null)) as { message?: string } | null;
    setSavingProfile(false);

    if (!response.ok) {
      toast.error(result?.message ?? "Impossible de mettre a jour le profil.");
      return;
    }

    toast.success("Profil mis a jour.");
    router.refresh();
  }

  async function resendVerification() {
    if (!user.email) {
      toast.error("Aucun email disponible sur ce compte.");
      return;
    }

    setSendingEmail(true);
    const response = await fetch("/api/accounts/verification/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier: user.email }),
    });
    const result = (await response.json().catch(() => null)) as { message?: string } | null;
    setSendingEmail(false);

    if (!response.ok) {
      toast.error(result?.message ?? "Impossible d'envoyer le code.");
      return;
    }

    toast.success("Code de verification envoye.");
  }

  async function changePassword(formData: FormData) {
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      toast.error("La confirmation du mot de passe ne correspond pas.");
      return;
    }

    setChangingPassword(true);
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const result = (await response.json().catch(() => null)) as { message?: string } | null;
    setChangingPassword(false);

    if (!response.ok) {
      toast.error(result?.message ?? "Impossible de changer le mot de passe.");
      return;
    }

    toast.success("Mot de passe change.");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
      <form action={submitProfile} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Nom complet</Label>
          <Input id="fullName" name="fullName" defaultValue={user.fullName ?? ""} required maxLength={180} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phoneNumber">Telephone</Label>
          <Input id="phoneNumber" name="phoneNumber" defaultValue={user.phoneNumber ?? ""} placeholder="+21620721843" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user.email ?? ""} readOnly />
          <p className="text-muted-foreground text-xs">Le changement email sera un parcours securise dedie.</p>
        </div>
        <Button type="submit" className="w-fit" disabled={savingProfile}>
          <Save />
          {savingProfile ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>

      <div className="grid gap-4">
        <div className="rounded-md border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <MailCheck className="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Verification email</p>
                <p className="text-muted-foreground text-sm">
                  {user.emailVerifiedAt ? "Votre email est verifie." : "Verifiez votre email avant eligibility finale."}
                </p>
              </div>
            </div>
            <Badge variant="outline">{user.emailVerifiedAt ? "OK" : "A verifier"}</Badge>
          </div>
          {!user.emailVerifiedAt ? (
            <Button variant="outline" size="sm" className="mt-4" onClick={resendVerification} disabled={sendingEmail}>
              {sendingEmail ? "Envoi..." : "Renvoyer le code"}
            </Button>
          ) : null}
        </div>

        <div className="rounded-md border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">MFA email</p>
                <p className="text-muted-foreground text-sm">
                  {user.mfaEnabled
                    ? "Un code email est demande lors du login."
                    : "Activation self-service a venir; le statut est prepare cote backend."}
                </p>
              </div>
            </div>
            <Badge variant="outline">{user.mfaEnabled ? "Activee" : "Inactive"}</Badge>
          </div>
          {!user.mfaEnabled ? (
            <Button variant="outline" size="sm" className="mt-4" disabled>
              Activation email a venir
            </Button>
          ) : null}
        </div>

        <Separator />

        <form action={changePassword} className="grid gap-3 rounded-md border p-4">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            <p className="font-medium">Changer le mot de passe</p>
          </div>
          <Input name="currentPassword" type="password" placeholder="Mot de passe actuel" required />
          <Input name="newPassword" type="password" placeholder="Nouveau mot de passe" required minLength={8} />
          <Input name="confirmPassword" type="password" placeholder="Confirmer le nouveau mot de passe" required />
          <Button type="submit" variant="outline" disabled={changingPassword}>
            {changingPassword ? "Changement..." : "Changer"}
          </Button>
        </form>
      </div>
    </div>
  );
}
