import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { CHANGE_PASSWORD_PATH, DASHBOARD_PATH, LOGIN_PATH, MERCHANT_DASHBOARD_PATH } from "@/lib/auth/auth.constants";
import { getSessionUser, isPasswordChangeRequired } from "@/lib/auth/auth.server";

import { UserNav } from "./_components/user-nav";

export default async function UserLayout({ children }: { children: ReactNode }) {
  if (await isPasswordChangeRequired()) {
    redirect(CHANGE_PASSWORD_PATH);
  }

  const session = await getSessionUser();
  if (!session) {
    redirect(LOGIN_PATH);
  }
  if (session.userType === "merchant") {
    redirect(MERCHANT_DASHBOARD_PATH);
  }
  if (session.userType !== "client") {
    redirect(DASHBOARD_PATH);
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[17rem_1fr]">
      <UserNav />
      <main className="min-w-0">
        <header className="flex h-14 items-center border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">Espace user</p>
            <p className="truncate font-medium text-sm">{session.name}</p>
          </div>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
