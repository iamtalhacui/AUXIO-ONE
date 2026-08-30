"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { orgAdminSettingsTabs } from "@/lib/dashboard/content/org-admin";

export function OrgAdminSettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="dashboard-card mb-6 p-2">
      <div className="flex flex-col gap-1 sm:flex-row">
        {orgAdminSettingsTabs.map((tab) => {
          const active = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-xl px-4 py-3 transition ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/80 hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              <span className="block text-sm font-semibold">{tab.label}</span>
              <span className="mt-0.5 block text-xs text-muted">{tab.description}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
