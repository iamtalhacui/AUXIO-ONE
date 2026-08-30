"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { DashboardConfig } from "@/lib/dashboard/config";
import { site } from "@/lib/content";
import { logout } from "@/lib/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  IconBell,
  IconBuilding,
  IconGrid,
  IconLogout,
  IconOverview,
  IconPlus,
  IconSettings,
} from "@/components/dashboard/icons";

const labelIconMap = {
  Dashboard: IconOverview,
  Organisations: IconBuilding,
  "Register organisation": IconPlus,
  "Pending invites": IconBell,
  "Module catalogue": IconGrid,
  Modules: IconGrid,
  Entitlements: IconGrid,
  "Platform settings": IconSettings,
  Settings: IconSettings,
  Configuration: IconSettings,
  "Audit log": IconSettings,
  "Usage & health": IconOverview,
  Notifications: IconBell,
  "Support access": IconBuilding,
  Reports: IconGrid,
  Team: IconBuilding,
  Workforce: IconBuilding,
  Compliance: IconSettings,
  Schedule: IconGrid,
  Matching: IconGrid,
  Shifts: IconOverview,
  Timesheets: IconGrid,
} as const;

function getIcon(label: string) {
  if (label in labelIconMap) {
    return labelIconMap[label as keyof typeof labelIconMap];
  }
  return IconOverview;
}

type DashboardSidebarProps = {
  config: DashboardConfig;
};

export function DashboardSidebar({ config }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  function isActive(href: string) {
    if (href === config.basePath) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="dashboard-sidebar">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <Link href={config.basePath} className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            A1
          </span>
          <div>
            <p className="text-sm font-semibold">{site.name}</p>
            <p className="text-xs text-muted">{config.roleLabel}</p>
          </div>
        </Link>
      </div>

      <nav className="dashboard-nav-scroll flex-1 overflow-y-auto px-4 py-5">
        {config.sidebarGroups.map((group) => (
          <div key={group.title} className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = getIcon(item.label);
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/80 hover:bg-surface-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-[18px] w-[18px] ${active ? "text-primary" : "text-muted"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border p-4">
        <div className="rounded-2xl bg-surface-muted px-4 py-3">
          <p className="text-sm font-semibold">{user?.name ?? config.roleLabel}</p>
          <p className="truncate text-xs text-muted">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            dispatch(logout());
            router.replace("/login");
          }}
          className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
        >
          <IconLogout className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
