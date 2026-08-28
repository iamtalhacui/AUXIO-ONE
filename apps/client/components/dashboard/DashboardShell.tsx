"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getDashboardConfigForPath } from "@/lib/dashboard/config";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const config = getDashboardConfigForPath(pathname);

  if (!config) return null;

  return (
    <div className="dashboard-shell">
      <DashboardSidebar config={config} />
      <div className="dashboard-main">
        <DashboardTopBar config={config} />
        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
}
