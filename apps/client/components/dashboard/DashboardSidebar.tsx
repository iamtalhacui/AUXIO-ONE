"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DashboardConfig, NavItem } from "@/lib/dashboard/config";
import { isNavItemActive } from "@/lib/dashboard/config";
import { site } from "@/lib/content";
import { logoutOrg } from "@/lib/store/orgAuthSlice";
import { logoutPlatform } from "@/lib/store/platformAuthSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { OrgLogoMark } from "@/components/dashboard/OrgLogoMark";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  IconBell,
  IconBuilding,
  IconClipboard,
  IconGrid,
  IconLock,
  IconLogout,
  IconOverview,
  IconPlus,
  IconSettings,
} from "@/components/dashboard/icons";

const labelIconMap: Record<string, typeof IconOverview> = {
  Dashboard: IconOverview,
  Overview: IconOverview,
  Onboarding: IconClipboard,
  Organisations: IconBuilding,
  "All organisations": IconBuilding,
  "Register organisation": IconPlus,
  "Pending invites": IconBell,
  Modules: IconGrid,
  "Module catalogue": IconGrid,
  Entitlements: IconGrid,
  "Platform settings": IconSettings,
  "Demo Requests": IconBell,
  "Audit log": IconSettings,
  Team: IconBuilding,
  "All members": IconBuilding,
  "Register member": IconPlus,
  Roles: IconSettings,
  Configuration: IconSettings,
  "Organisation details": IconSettings,
  Security: IconSettings,
  Customers: IconBuilding,
  CRM: IconGrid,
  Compliance: IconSettings,
  Schedule: IconGrid,
  Matching: IconGrid,
  "Shifts & timesheets": IconOverview,
  Shifts: IconOverview,
  Timesheets: IconGrid,
  "Your profile": IconSettings,
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

  const active =
    item.label === "Onboarding" &&
    (pathname === basePath || pathname.startsWith(`${basePath}/onboarding`))
      ? true
      : isNavItemActive(pathname, item, basePath);
  const Icon = nested ? null : getIcon(item.label);

  if (item.locked) {
    return (
      <span
        className={`nav-link cursor-not-allowed opacity-45 ${nested ? "nav-link-nested" : ""}`}
        aria-disabled="true"
        title="Complete onboarding to unlock"
      >
        {!nested && Icon ? <Icon className="nav-link-icon" /> : null}
        <span className="flex-1">{item.label}</span>
        <IconLock className="h-3.5 w-3.5 shrink-0 text-muted" />
      </span>
    );
  }

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
  lockedOnboarding?: boolean;
};

export function DashboardSidebar({ config, lockedOnboarding }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const platformUser = useAppSelector((state) => state.platformAuth.user);
  const orgUser = useAppSelector((state) => state.orgAuth.user);
  const organisation = useAppSelector((state) => state.orgAuth.organisation);
  const isPlatform = pathname.startsWith("/super-admin");
  const displayName = isPlatform
    ? (platformUser?.name ?? config.roleLabel)
    : orgUser
      ? `${orgUser.firstName} ${orgUser.lastName}`
      : config.roleLabel;
  const email = isPlatform ? platformUser?.email : orgUser?.email;
  const brandLabel = isPlatform
    ? site.name
    : organisation?.tradingName || organisation?.name || site.name;
  const brandFallback = brandLabel
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "A1";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleSignOut() {
    if (isPlatform) {
      dispatch(logoutPlatform());
      router.replace("/platform/login");
      return;
    }
    dispatch(logoutOrg());
    router.replace("/login");
  }

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar-brand">
        <Link href={config.basePath} className="flex items-center gap-3">
          {isPlatform ? (
            <BrandLogo size={36} className="h-9 w-9 object-contain" />
          ) : (
            <OrgLogoMark fallback={brandFallback} />
          )}
          <span className="truncate text-sm font-semibold tracking-tight">{brandLabel}</span>
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
        {lockedOnboarding ? (
          <div className="mb-2 rounded-xl border border-border/60 bg-[#f4f6f8] px-3 py-3">
            <p className="text-sm font-semibold text-foreground">Need a hand?</p>
            <a
              href={`mailto:${site.contactEmail}`}
              className="mt-1 block text-sm font-medium text-primary hover:underline"
            >
              Contact support
            </a>
          </div>
        ) : null}
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className="truncate text-xs text-muted">{email ?? config.roleLabel}</p>
          </div>
        </div>
        <button type="button" onClick={handleSignOut} className="nav-signout">
          <IconLogout className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
