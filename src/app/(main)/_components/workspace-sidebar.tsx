"use client";

import type { ComponentProps, ComponentType } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BadgeCheck, ChevronRight, LogOut, PlusCircleIcon } from "lucide-react";

import LogoNeutrinoCar from "@/components/icon/logo-neutrino-car";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { logout } from "@/lib/auth/logout.client";

export type WorkspaceNavItem = {
  badge?: string | number | null;
  children?: WorkspaceNavItem[];
  disabled?: boolean;
  href: string;
  icon?: ComponentType<{ className?: string }>;
  label: string;
};

type WorkspaceBalanceCard = {
  detail?: string;
  href?: string;
  label: string;
  value: string;
};

type WorkspaceSidebarProps = ComponentProps<typeof Sidebar> & {
  balanceCard?: WorkspaceBalanceCard | null;
  homeHref: string;
  items: WorkspaceNavItem[];
  subtitle: string;
  title: string;
  userLabel?: string | null;
};

export function WorkspaceSidebar({
  balanceCard,
  homeHref,
  items,
  subtitle,
  title,
  userLabel,
  ...props
}: WorkspaceSidebarProps) {
  return (
    <Sidebar {...props} variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={title}>
              <Link prefetch={false} href={homeHref}>
                <LogoNeutrinoCar className="h-9 w-9 text-blue-500" />
                <span className="grid min-w-0">
                  <span className="truncate font-semibold text-sm">{title}</span>
                  <span className="truncate text-muted-foreground text-xs">{subtitle}</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {balanceCard ? <SidebarBalanceCard balance={balanceCard} /> : null}

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <WorkspaceSidebarItem key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Deconnexion" onClick={() => logout()}>
              <LogOut />
              <span>Deconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {userLabel ? (
            <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
              <div className="min-w-0 px-2 pb-1 text-muted-foreground text-xs">
                <span className="block truncate">{userLabel}</span>
              </div>
            </SidebarMenuItem>
          ) : null}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarBalanceCard({ balance }: { balance: WorkspaceBalanceCard }) {
  const content = (
    <>
      <PlusCircleIcon />
      <span className="truncate">{balance.value}</span>
    </>
  );

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            {balance.href ? (
              <SidebarMenuButton
                asChild
                tooltip={balance.detail ?? balance.label}
                className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <Link prefetch={false} href={balance.href}>
                  {content}
                </Link>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                tooltip={balance.detail ?? balance.label}
                className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                {content}
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function WorkspaceSidebarItem({ item }: { item: WorkspaceNavItem }) {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const Icon = item.icon;
  const isActive = isItemActive(pathname, item);
  const submenuOpen = item.children?.some((child) => isItemActive(pathname, child)) ?? false;

  if (item.children?.length) {
    return (
      <Collapsible asChild defaultOpen={submenuOpen} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton disabled={item.disabled} isActive={isActive} tooltip={item.label}>
              {Icon ? <Icon /> : null}
              <span>{item.label}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                return (
                  <SidebarMenuSubItem key={child.href}>
                    <SidebarMenuSubButton
                      asChild
                      aria-disabled={child.disabled}
                      isActive={isItemActive(pathname, child)}
                    >
                      <Link prefetch={false} href={child.disabled ? "#" : child.href}>
                        {ChildIcon ? <ChildIcon /> : null}
                        <span>{child.label}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  if (item.disabled) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton disabled tooltip={item.label}>
          {Icon ? <Icon /> : null}
          <span>{item.label}</span>
          <BadgeCheck className="ml-auto size-3.5 opacity-40" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
        <Link prefetch={false} href={item.href}>
          {Icon ? <Icon /> : null}
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
      {item.badge && (state !== "collapsed" || isMobile) ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
    </SidebarMenuItem>
  );
}

function isItemActive(pathname: string, item: WorkspaceNavItem): boolean {
  if (item.children?.length) {
    return pathname === item.href || item.children.some((child) => isItemActive(pathname, child));
  }

  return pathname === item.href;
}
