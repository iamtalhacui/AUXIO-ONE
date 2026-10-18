"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  IconBriefcase,
  IconBuilding,
  IconCalendar,
  IconCalendarCheck,
  IconChartBar,
  IconChevronDown,
  IconClipboard,
  IconClock,
  IconFileCheck,
  IconIdBadge,
  IconLayers,
  IconLock,
  IconLogout,
  IconMegaphone,
  IconMenu,
  IconMoreVertical,
  IconOverview,
  IconPlus,
  IconSettings,
  IconShield,
  IconShuffle,
  IconUserPlus,
  IconUsers,
  IconAlert,
} from "@/components/dashboard/icons";

const COLLAPSE_STORAGE_KEY = "sb_collapsed";

const ICONS_BY_LABEL: Record<string, typeof IconOverview> = {
  Dashboard: IconOverview,
  Overview: IconOverview,
  Onboarding: IconClipboard,
  Organisations: IconBuilding,
  "All organisations": IconBuilding,
  "Register organisation": IconPlus,
  "Pending invites": IconBell,
  Modules: IconLayers,
  "Module catalogue": IconLayers,
  Entitlements: IconLayers,
  "Platform settings": IconSettings,
  "Demo Requests": IconMegaphone,
  "Audit log": IconFileCheck,
  Team: IconUsers,
  "All members": IconUsers,
  "Register member": IconUserPlus,
  Roles: IconIdBadge,
  Configuration: IconSettings,
  "Organisation details": IconBuilding,
  "Service line tasks": IconClipboard,
  Security: IconShield,
  "Shift approvals": IconCalendarCheck,
  "Onboarding reviews": IconIdBadge,
  Customers: IconUsers,
  CRM: IconMegaphone,
  Incidents: IconAlert,
  Compliance: IconShield,
  Workforce: IconUsers,
  Schedule: IconCalendar,
  Matching: IconShuffle,
  "Forms & documents": IconFileCheck,
  Finance: IconChartBar,
  Insights: IconChartBar,
  "Shifts & timesheets": IconClock,
  Shifts: IconClock,
  Availability: IconCalendarCheck,
  Timesheets: IconFileCheck,
  "Your profile": IconIdBadge,
  Notifications: IconBell,
  Reports: IconChartBar,
};

function iconFor(label: string) {
  return ICONS_BY_LABEL[label] ?? IconBriefcase;
}

function firstHref(item: NavItem): string | undefined {
  if (item.href) return item.href;
  return item.children?.find((child) => child.href)?.href;
}

/** A single leaf link (no children). Used both top-level and nested. */
function SidebarLink({
  item,
  pathname,
  basePath,
  nested,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  basePath: string;
  nested?: boolean;
  collapsed?: boolean;
}) {
  if (!item.href) return null;

  const active =
    item.label === "Onboarding" &&
    (pathname === basePath || pathname.startsWith(`${basePath}/onboarding`))
      ? true
      : isNavItemActive(pathname, item, basePath);
  const Icon = iconFor(item.label);

  if (item.locked) {
    return (
      <div className="sb-item-wrap group">
        <span className="sb-locked" aria-disabled="true">
          {!nested ? <Icon className="sb-link-icon" aria-hidden /> : null}
          {!collapsed ? <span className="sb-link-label">{item.label}</span> : null}
          <IconLock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </span>
        {collapsed ? (
          <span role="tooltip" className="sb-tooltip">
            {item.label} — locked
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="sb-item-wrap group">
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`${nested ? "sb-sublink" : "sb-link"} ${active ? (nested ? "sb-sublink-active" : "sb-link-active") : ""}`}
      >
        {!nested ? <Icon className="sb-link-icon" aria-hidden /> : null}
        {!collapsed ? <span className="sb-link-label">{item.label}</span> : null}
      </Link>
      {collapsed ? (
        <span role="tooltip" className="sb-tooltip">
          {item.label}
        </span>
      ) : null}
    </div>
  );
}

/** A nav item that may expand into a nested submenu. */
function SidebarBranch({
  item,
  pathname,
  basePath,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  basePath: string;
  collapsed: boolean;
}) {
  const branchActive = isNavItemActive(pathname, item, basePath);
  const [open, setOpen] = useState(branchActive);
  const Icon = iconFor(item.label);

  useEffect(() => {
    if (branchActive) setOpen(true);
  }, [branchActive]);

  if (!item.children?.length) {
    return (
      <SidebarLink item={item} pathname={pathname} basePath={basePath} collapsed={collapsed} />
    );
  }

  // Collapsed rail: render as a direct link to the first child, with a tooltip
  // listing the group label (no room for an inline flyout submenu).
  if (collapsed) {
    const target = firstHref(item);
    return (
      <div className="sb-item-wrap group">
        {target ? (
          <Link
            href={target}
            aria-current={branchActive ? "page" : undefined}
            className={`sb-link ${branchActive ? "sb-link-active" : ""}`}
          >
            <Icon className="sb-link-icon" aria-hidden />
          </Link>
        ) : (
          <span className="sb-link">
            <Icon className="sb-link-icon" aria-hidden />
          </span>
        )}
        <span role="tooltip" className="sb-tooltip">
          {item.label}
        </span>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`sb-link w-full ${branchActive ? "sb-link-active" : ""}`}
      >
        <Icon className="sb-link-icon" aria-hidden />
        <span className="sb-link-label">{item.label}</span>
        <IconChevronDown className={`sb-chevron ${open ? "sb-chevron-open" : ""}`} aria-hidden />
      </button>
      {open ? (
        <div className="sb-sublist">
          {item.children.map((child) => (
            <SidebarLink
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

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const platformUser = useAppSelector((state) => state.platformAuth.user);
  const orgUser = useAppSelector((state) => state.orgAuth.user);
  const organisation = useAppSelector((state) => state.orgAuth.organisation);
  const isPlatform = pathname.startsWith("/super-admin");

  // Restore collapsed preference.
  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close the mobile drawer on Escape.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setProfileMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const displayName = isPlatform
    ? (platformUser?.name ?? config.roleLabel)
    : orgUser
      ? `${orgUser.firstName} ${orgUser.lastName}`
      : config.roleLabel;
  const email = isPlatform ? platformUser?.email : orgUser?.email;
  const brandLabel = isPlatform
    ? site.name
    : organisation?.tradingName || organisation?.name || site.name;
  const brandFallback =
    brandLabel
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
    setProfileMenuOpen(false);
    if (isPlatform) {
      dispatch(logoutPlatform());
      router.replace("/platform/login");
      return;
    }
    dispatch(logoutOrg());
    router.replace("/login");
  }

  const accountGroup = config.sidebarGroups.find((group) => group.title === "Account");
  const mainGroups = config.sidebarGroups.filter((group) => group !== accountGroup);

  return (
    <>
      <button
        type="button"
        className="sb-mobile-toggle"
        aria-label="Open navigation menu"
        onClick={() => setMobileOpen(true)}
      >
        <IconMenu className="h-5 w-5" aria-hidden />
      </button>

      {mobileOpen ? (
        <div className="sb-overlay" onClick={() => setMobileOpen(false)} aria-hidden />
      ) : null}

      <aside
        className={`sb-root ${collapsed ? "sb-collapsed" : ""} ${mobileOpen ? "sb-mobile-open" : ""}`}
        aria-label="Primary"
      >
        <div className="sb-header">
          <Link href={config.basePath} className="sb-brand">
            {isPlatform ? (
              <BrandLogo size={36} className="h-9 w-9 shrink-0 object-contain" />
            ) : (
              <OrgLogoMark fallback={brandFallback} />
            )}
            {!collapsed ? <span className="sb-brand-label">{brandLabel}</span> : null}
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="sb-collapse-btn"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
          >
            <IconChevronDown className={`h-4 w-4 ${collapsed ? "-rotate-90" : "rotate-90"}`} aria-hidden />
          </button>
        </div>

        <div className="sb-divider" />

        <nav className="sb-nav" aria-label="Dashboard navigation">
          {mainGroups.map((group) => (
            <div key={group.title} className="sb-group">
              {!collapsed ? <p className="sb-section-label">{group.title}</p> : null}
              {group.items.map((item) => (
                <SidebarBranch
                  key={item.label}
                  item={item}
                  pathname={pathname}
                  basePath={config.basePath}
                  collapsed={collapsed}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="sb-divider" />

        <div className="sb-footer">
          {lockedOnboarding && !collapsed ? (
            <div className="sb-help-card">
              <p className="text-sm font-semibold text-foreground">Need a hand?</p>
              <a href={`mailto:${site.contactEmail}`} className="mt-1 block text-sm font-medium text-primary hover:underline">
                Contact support
              </a>
            </div>
          ) : null}

          {accountGroup
            ? accountGroup.items.map((item) => (
                <SidebarBranch
                  key={item.label}
                  item={item}
                  pathname={pathname}
                  basePath={config.basePath}
                  collapsed={collapsed}
                />
              ))
            : null}

          <div className="sb-item-wrap group" ref={menuRef}>
            <div className={`sb-profile ${collapsed ? "justify-center" : ""}`}>
              <span className="sb-avatar">
                {initials}
                <span className="sb-status-dot" aria-hidden />
              </span>
              {!collapsed ? (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="sb-profile-name">{displayName}</p>
                    <p className="sb-profile-meta">{email ?? config.roleLabel}</p>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen((value) => !value)}
                      className="sb-icon-btn"
                      aria-label="Profile menu"
                      aria-haspopup="menu"
                      aria-expanded={profileMenuOpen}
                    >
                      <IconMoreVertical className="h-4 w-4" aria-hidden />
                    </button>
                    {profileMenuOpen ? (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setProfileMenuOpen(false)} />
                        <div className="sb-menu" role="menu">
                          <button type="button" onClick={handleSignOut} className="sb-menu-item sb-menu-item-danger" role="menuitem">
                            <IconLogout className="h-4 w-4" aria-hidden />
                            Sign out
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
            {collapsed ? (
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sign out"
                className="sb-tooltip pointer-events-auto cursor-pointer"
              >
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
