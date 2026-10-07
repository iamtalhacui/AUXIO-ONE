"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useConfirmOrgSession } from "@/components/auth/useConfirmOrgSession";
import { useListOrgModulesQuery } from "@/lib/api/authApi";
import {
  getDashboardConfigForPath,
  getDashboardConfigForRole,
} from "@/lib/dashboard/config";
import { filterNavByModules, findFirstNavHref } from "@/lib/dashboard/nav-modules";
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
  const router = useRouter();
  const orgUser = useAppSelector((state) => state.orgAuth.user);
  const permissions = useAppSelector((state) => state.orgAuth.permissions);
  const platformUser = useAppSelector((state) => state.platformAuth.user);
  const isPlatform = pathname.startsWith("/super-admin");

  const config = useMemo(() => {
    if (isPlatform) return getDashboardConfigForPath(pathname);
    return (
      getDashboardConfigForRole(orgUser?.role) ??
      getDashboardConfigForPath(pathname)
    );
  }, [isPlatform, orgUser?.role, pathname]);

  const sessionOk = useConfirmOrgSession(Boolean(orgUser) && !isPlatform);
  const lockedOnboarding =
    !isPlatform && needsOnboardingLock(orgUser?.role, orgUser?.onboardingStatus);

  const { data: modules } = useListOrgModulesQuery(undefined, {
    skip: !orgUser || isPlatform || !sessionOk || lockedOnboarding,
  });

  const moduleGatingReady = Boolean(
    config && orgUser && !isPlatform && !lockedOnboarding && modules,
  );

  const filteredConfig = useMemo(() => {
    if (!config) return null;
    if (lockedOnboarding) return withLockedOnboardingNav(config);
    if (!orgUser || isPlatform || !modules) return config;
    const enabledCodes = modules.filter((mod) => mod.enabled).map((mod) => mod.code);
    return {
      ...config,
      sidebarGroups: filterNavByModules(
        config.sidebarGroups,
        enabledCodes,
        permissions,
        orgUser.role === "ORG_ADMIN",
      ),
    };
  }, [config, isPlatform, lockedOnboarding, modules, orgUser, permissions]);

  // The role home page belongs to the DASHBOARD module. Without it, send the
  // user to their first enabled page instead of an empty overview.
  const dashboardDisabled = Boolean(
    moduleGatingReady &&
      config &&
      pathname === config.basePath &&
      !modules?.some((mod) => mod.code === "DASHBOARD" && mod.enabled),
  );
  const fallbackHref =
    dashboardDisabled && filteredConfig
      ? findFirstNavHref(filteredConfig.sidebarGroups, filteredConfig.basePath)
      : null;

  useEffect(() => {
    if (fallbackHref) router.replace(fallbackHref);
  }, [fallbackHref, router]);

  if (!filteredConfig) return null;

  const notificationsEnabled = isPlatform ? Boolean(platformUser) : Boolean(orgUser) && sessionOk;

  return (
    <div className="dashboard-shell">
      <DashboardSidebar config={filteredConfig} lockedOnboarding={lockedOnboarding} />
      <main className="dashboard-main">
        <DashboardHeader
          config={filteredConfig}
          isPlatform={isPlatform}
          notificationsEnabled={notificationsEnabled}
        />
        <div className="dashboard-content">
          {dashboardDisabled ? <DashboardUnavailable /> : children}
        </div>
      </main>
    </div>
  );
}

/** Shown when DASHBOARD is off and no other page is enabled to fall back to. */
function DashboardUnavailable() {
  return (
    <div className="dashboard-card px-6 py-12 text-center">
      <p className="text-sm font-semibold">No dashboard on your plan</p>
      <p className="mt-1 text-sm text-muted">
        Ask your Org Admin to enable a module, or upgrade the plan to add dashboards.
      </p>
    </div>
  );
}
