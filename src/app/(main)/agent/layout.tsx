import type { CSSProperties, ReactNode } from "react";

import { redirect } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CHANGE_PASSWORD_PATH, DASHBOARD_PATH, LOGIN_PATH } from "@/lib/auth/auth.constants";
import { getSessionUser, isPasswordChangeRequired } from "@/lib/auth/auth.server";
import { cn } from "@/lib/utils";

import { AgentNav } from "./_components/agent-nav";

export default async function AgentLayout({ children }: { children: ReactNode }) {
  if (await isPasswordChangeRequired()) {
    redirect(CHANGE_PASSWORD_PATH);
  }

  const session = await getSessionUser();
  if (!session) {
    redirect(LOGIN_PATH);
  }
  if (session.userType !== "cash_agent") {
    redirect(DASHBOARD_PATH);
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
        } as CSSProperties
      }
    >
      <AgentNav userLabel={session.name} />
      <SidebarInset className={cn("peer-data-[variant=inset]:border")}>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur">
          <div className="flex w-full items-center gap-2 px-4 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">Espace agent cash</p>
              <p className="truncate font-medium text-sm">{session.name}</p>
            </div>
          </div>
        </header>
        <div className="h-full p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
