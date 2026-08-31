"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getDashboardConfigForPath } from "@/lib/dashboard/config";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

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
      <main className="dashboard-main">
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
