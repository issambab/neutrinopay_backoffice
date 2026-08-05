import type { ComponentType } from "react";

import { CalendarClock, MailCheck, ShieldCheck, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/auth/auth.server";
import { formatWalletEnum, walletStatusClassName } from "@/lib/wallet/wallet-format";

import { UserProfileForm } from "./user-profile-form";

export default async function UserProfilePage() {
  const profile = await getCurrentUserProfile();
  const user = profile.user;

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Profil et securite</h1>
          <p className="text-muted-foreground text-sm">
            Identite du compte wallet, verification email, MFA et mot de passe.
          </p>
        </div>
        <Badge variant="outline" className={walletStatusClassName(user.status)}>
          Compte {formatWalletEnum(user.status)}
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <InfoCard icon={UserRound} label="Type" value={formatWalletEnum(user.userType)} />
        <InfoCard icon={MailCheck} label="Email" value={user.emailVerifiedAt ? "Verifie" : "Non verifie"} />
        <InfoCard icon={ShieldCheck} label="MFA" value={user.mfaEnabled ? "Activee" : "Inactive"} />
        <InfoCard
          icon={CalendarClock}
          label="Derniere connexion"
          value={user.lastLoginAt ? formatDate(user.lastLoginAt) : "Jamais"}
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <UserProfileForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="font-semibold text-lg">{value}</p>
        </div>
        <Icon className="size-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
