"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useConfirmOrgSession } from "@/components/auth/useConfirmOrgSession";
import { useListOrgModulesQuery } from "@/lib/api/authApi";
import { getDashboardConfigForPath } from "@/lib/dashboard/config";
import { filterNavByModules } from "@/lib/dashboard/nav-modules";
import { useAppSelector } from "@/lib/store/hooks";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const orgUser = useAppSelector((state) => state.orgAuth.user);
  const isPlatform = pathname.startsWith("/super-admin");
  const config = getDashboardConfigForPath(pathname);
  const sessionOk = useConfirmOrgSession(Boolean(orgUser) && !isPlatform);

  const { data: modules } = useListOrgModulesQuery(undefined, {
    skip: !orgUser || isPlatform || !sessionOk,
  });

  const filteredConfig = useMemo(() => {
    if (!config) return null;
    if (!orgUser || isPlatform || !modules) return config;
    const enabledCodes = modules.filter((mod) => mod.enabled).map((mod) => mod.code);
    return {
      ...config,
      sidebarGroups: filterNavByModules(config.sidebarGroups, enabledCodes),
    };
  }, [config, isPlatform, modules, orgUser]);

  if (!filteredConfig) return null;

  return (
    <div className="dashboard-shell">
      <DashboardSidebar config={filteredConfig} />
      <main className="dashboard-main">
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
