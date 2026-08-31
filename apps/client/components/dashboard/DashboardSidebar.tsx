"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DashboardConfig, NavItem } from "@/lib/dashboard/config";
import { isNavItemActive } from "@/lib/dashboard/config";
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

const labelIconMap: Record<string, typeof IconOverview> = {
  Dashboard: IconOverview,
  Organisations: IconBuilding,
  "All organisations": IconBuilding,
  "Register organisation": IconPlus,
  "Pending invites": IconBell,
  Modules: IconGrid,
  "Module catalogue": IconGrid,
  Entitlements: IconGrid,
  "Platform settings": IconSettings,
  "Audit log": IconSettings,
  Team: IconBuilding,
  "All members": IconBuilding,
  "Register member": IconPlus,
  Roles: IconSettings,
  Configuration: IconSettings,
  "Organisation details": IconSettings,
  Security: IconSettings,
  Workforce: IconBuilding,
  Compliance: IconSettings,
  Schedule: IconGrid,
  Matching: IconGrid,
  "Shifts & timesheets": IconOverview,
  Shifts: IconOverview,
  Timesheets: IconGrid,
  "Your profile": IconSettings,
  "Usage & health": IconOverview,
  Notifications: IconBell,
  Reports: IconGrid,
};

function getIcon(label: string) {
  return labelIconMap[label] ?? IconOverview;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function NavLink({
  item,
  pathname,
  basePath,
  nested,
}: {
  item: NavItem;
  pathname: string;
  basePath: string;
  nested?: boolean;
}) {
  if (!item.href) return null;

  const active = isNavItemActive(pathname, item, basePath);
  const Icon = nested ? null : getIcon(item.label);

  return (
    <Link
      href={item.href}
      className={`nav-link ${active ? "nav-link-active" : ""} ${nested ? "nav-link-nested" : ""}`}
    >
      {active ? <span className={`nav-link-bar ${nested ? "" : "left-0"}`} aria-hidden /> : null}
      {!nested && Icon ? <Icon className="nav-link-icon" /> : null}
      <span>{item.label}</span>
    </Link>
  );
}

function NavBranch({
  item,
  pathname,
  basePath,
}: {
  item: NavItem;
  pathname: string;
  basePath: string;
}) {
  const branchActive = isNavItemActive(pathname, item, basePath);
  const [open, setOpen] = useState(branchActive);
  const Icon = getIcon(item.label);

  useEffect(() => {
    if (branchActive) setOpen(true);
  }, [branchActive]);

  if (!item.children?.length) {
    return <NavLink item={item} pathname={pathname} basePath={basePath} />;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`nav-link w-full ${branchActive ? "nav-link-parent-active" : ""}`}
      >
        <Icon className="nav-link-icon" />
        <span className="flex-1 text-left">{item.label}</span>
        <Chevron open={open} />
      </button>
      {open ? (
        <div className="nav-nested">
          {item.children.map((child) => (
            <NavLink
              key={child.href ?? child.label}
              item={child}
              pathname={pathname}
              basePath={basePath}
              nested
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

type DashboardSidebarProps = {
  config: DashboardConfig;
};

export function DashboardSidebar({ config }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const initials = (user?.name ?? config.roleLabel)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar-brand">
        <Link href={config.basePath} className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
            A1
          </span>
          <span className="text-sm font-semibold tracking-tight">{site.name}</span>
        </Link>
      </div>

      <nav className="dashboard-nav-scroll flex-1 overflow-y-auto px-3 py-4">
        {config.sidebarGroups.map((group) => (
          <div key={group.title} className="mb-5 last:mb-0">
            <p className="nav-section-label">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavBranch key={item.label} item={item} pathname={pathname} basePath={config.basePath} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="dashboard-sidebar-footer">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user?.name ?? config.roleLabel}</p>
            <p className="truncate text-xs text-muted">{config.roleLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            dispatch(logout());
            router.replace("/login");
          }}
          className="nav-signout"
        >
          <IconLogout className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
