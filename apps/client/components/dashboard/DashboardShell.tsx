"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useConfirmOrgSession } from "@/components/auth/useConfirmOrgSession";
import { useListOrgModulesQuery } from "@/lib/api/authApi";
import { getDashboardConfigForPath } from "@/lib/dashboard/config";
import { filterNavByModules } from "@/lib/dashboard/nav-modules";
import {
  needsOnboardingLock,
  withLockedOnboardingNav,
} from "@/lib/onboarding/access";
import { useAppSelector } from "@/lib/store/hooks";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const orgUser = useAppSelector((state) => state.orgAuth.user);
  const platformUser = useAppSelector((state) => state.platformAuth.user);
  const isPlatform = pathname.startsWith("/super-admin");
  const config = getDashboardConfigForPath(pathname);
  const sessionOk = useConfirmOrgSession(Boolean(orgUser) && !isPlatform);
  const lockedOnboarding =
    !isPlatform && needsOnboardingLock(orgUser?.role, orgUser?.onboardingStatus);

  const { data: modules } = useListOrgModulesQuery(undefined, {
    skip: !orgUser || isPlatform || !sessionOk || lockedOnboarding,
  });

  const filteredConfig = useMemo(() => {
    if (!config) return null;
    if (lockedOnboarding) return withLockedOnboardingNav(config);
    if (!orgUser || isPlatform || !modules) return config;
    const enabledCodes = modules.filter((mod) => mod.enabled).map((mod) => mod.code);
    return {
      ...config,
      sidebarGroups: filterNavByModules(config.sidebarGroups, enabledCodes),
    };
  }, [config, isPlatform, lockedOnboarding, modules, orgUser]);

  if (!filteredConfig) return null;

  const notificationsEnabled = isPlatform ? Boolean(platformUser) : Boolean(orgUser) && sessionOk;

  return (
    <div className="dashboard-shell">
      <DashboardSidebar config={filteredConfig} lockedOnboarding={lockedOnboarding} />
      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <NotificationCenter isPlatform={isPlatform} enabled={notificationsEnabled} />
        </div>
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
