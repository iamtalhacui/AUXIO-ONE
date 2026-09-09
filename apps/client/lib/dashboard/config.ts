import type { UserRole } from "@/lib/dashboard/roles";

export type NavItem = {
  label: string;
  href?: string;
  module?: string;
  children?: NavItem[];
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export type DashboardConfig = {
  role: UserRole;
  basePath: string;
  roleLabel: string;
  title: string;
  sidebarGroups: NavGroup[];
};

const superAdminNav: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/super-admin" }],
  },
  {
    title: "Platform",
    items: [
      {
        label: "Organisations",
        children: [
          { label: "All organisations", href: "/super-admin/organisations" },
          { label: "Register organisation", href: "/super-admin/organisations/new" },
          { label: "Pending invites", href: "/super-admin/invites" },
        ],
      },
      {
        label: "Modules",
        children: [
          { label: "Module catalogue", href: "/super-admin/modules" },
          { label: "Entitlements", href: "/super-admin/entitlements" },
        ],
      },
      { label: "Platform settings", href: "/super-admin/settings" },
      { label: "Audit log", href: "/super-admin/audit" },
    ],
  },
  {
    title: "Monitoring",
    items: [
      { label: "Notifications", href: "/super-admin/notifications" },
      { label: "Reports", href: "/super-admin/reports" },
    ],
  },
];

const orgAdminNav: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/org-admin" }],
  },
  {
    title: "Organisation",
    items: [
      {
        label: "Team",
        module: "WORKFORCE",
        children: [
          { label: "All members", href: "/org-admin/team", module: "WORKFORCE" },
          { label: "Register member", href: "/org-admin/team/register", module: "WORKFORCE" },
        ],
      },
      { label: "Roles", href: "/org-admin/roles" },
      {
        label: "Configuration",
        children: [
          { label: "Organisation details", href: "/org-admin/settings/organisation" },
          { label: "Modules", href: "/org-admin/settings/modules" },
          { label: "Security", href: "/org-admin/settings/password" },
        ],
      },
    ],
  },
];

const managerNav: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/manager" }],
  },
  {
    title: "Operations",
    items: [
      { label: "Workforce", href: "/manager/workforce", module: "WORKFORCE" },
    ],
  },
  {
    title: "Account",
    items: [{ label: "Your profile", href: "/manager/profile" }],
  },
];

const rosterNav: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/roster" }],
  },
  {
    title: "Rostering",
    items: [
      { label: "Schedule", href: "/roster/schedule", module: "SCHEDULE" },
      { label: "Matching", href: "/roster/matching", module: "SCHEDULE" },
    ],
  },
  {
    title: "Account",
    items: [{ label: "Your profile", href: "/roster/profile" }],
  },
];

const employeeNav: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/employee" }],
  },
  {
    title: "My work",
    items: [
      {
        label: "Shifts & timesheets",
        children: [
          { label: "Shifts", href: "/employee/shifts", module: "SCHEDULE" },
          { label: "Timesheets", href: "/employee/timesheets", module: "SERVICE_DELIVERY" },
        ],
      },
    ],
  },
  {
    title: "Account",
    items: [{ label: "Your profile", href: "/employee/profile" }],
  },
];

export const DASHBOARD_CONFIGS: DashboardConfig[] = [
  {
    role: "SUPER_ADMIN",
    basePath: "/super-admin",
    roleLabel: "Super Admin",
    title: "Platform Console",
    sidebarGroups: superAdminNav,
  },
  {
    role: "ORG_ADMIN",
    basePath: "/org-admin",
    roleLabel: "Org Admin",
    title: "Organisation Console",
    sidebarGroups: orgAdminNav,
  },
  {
    role: "MANAGER",
    basePath: "/manager",
    roleLabel: "Manager",
    title: "Manager Console",
    sidebarGroups: managerNav,
  },
  {
    role: "ROSTERING_EXPERT",
    basePath: "/roster",
    roleLabel: "Rostering Expert",
    title: "Rostering Console",
    sidebarGroups: rosterNav,
  },
  {
    role: "EMPLOYEE",
    basePath: "/employee",
    roleLabel: "Employee",
    title: "My Dashboard",
    sidebarGroups: employeeNav,
  },
];

export function getDashboardConfigForPath(pathname: string) {
  return DASHBOARD_CONFIGS.find((config) => pathname.startsWith(config.basePath)) ?? null;
}

export function getDashboardConfigForRole(role?: string) {
  return DASHBOARD_CONFIGS.find((config) => config.role === role) ?? null;
}

/** Collect all hrefs from nav tree for active-state checks. */
export function flattenNavHrefs(items: NavItem[]): string[] {
  return items.flatMap((item) => [
    ...(item.href ? [item.href] : []),
    ...(item.children ? flattenNavHrefs(item.children) : []),
  ]);
}

export function isNavItemActive(pathname: string, item: NavItem, basePath: string): boolean {
  if (!item.href) {
    return item.children?.some((child) => isNavItemActive(pathname, child, basePath)) ?? false;
  }

  if (item.href === basePath) return pathname === item.href;
  if (pathname === item.href) return true;

  if (!pathname.startsWith(`${item.href}/`)) return false;

  const remainder = pathname.slice(item.href.length + 1);
  const firstSegment = remainder.split("/")[0];
  const excludedSegments = new Set(["register"]);
  return !excludedSegments.has(firstSegment);
}
