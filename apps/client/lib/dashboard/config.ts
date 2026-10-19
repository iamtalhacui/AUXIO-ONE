import type {
  ActionPermission,
  PagePermission,
} from "@/lib/dashboard/content/org-admin-roles";
import type { UserRole } from "@/lib/dashboard/roles";

export type NavItem = {
  label: string;
  href?: string;
  module?: string;
  /** Role page permission required (configurable matrix). */
  page?: PagePermission;
  /** Role action permission required (configurable matrix). */
  action?: ActionPermission;
  locked?: boolean;
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

/** Personal worker tools — shown for any role with the matching action. */
const MY_WORK_PAGES: NavItem[] = [
  {
    label: "Shifts",
    href: "/my-shifts",
    module: "SCHEDULE",
    action: "VIEW_MY_SHIFTS",
  },
  {
    label: "Availability",
    href: "/my-availability",
    module: "SCHEDULE",
    action: "MANAGE_MY_AVAILABILITY",
  },
  {
    label: "Timesheets",
    href: "/my-timesheets",
    module: "FINANCE",
    action: "VIEW_MY_TIMESHEETS",
  },
];

/** Shared feature pages gated by page permission + module. */
const FEATURE_PAGES: NavItem[] = [
  { label: "CRM", href: "/crm", module: "CRM", page: "CRM" },
  { label: "Customers", href: "/customers", module: "CUSTOMERS", page: "CUSTOMERS" },
  { label: "Workforce", href: "/workforce", module: "WORKFORCE", page: "WORKFORCE" },
  { label: "Schedule", href: "/schedule", module: "SCHEDULE", page: "SCHEDULE" },
  {
    label: "Matching",
    href: "/schedule/matching",
    module: "SCHEDULE",
    page: "SCHEDULE",
  },
  {
    label: "Shift approvals",
    href: "/shift-approvals",
    module: "SERVICE_DELIVERY",
    action: "APPROVE_TIMESHEETS_SERVICE_DELIVERY",
  },
  {
    label: "Onboarding reviews",
    href: "/onboarding-reviews",
    module: "WORKFORCE",
    action: "APPROVE_ONBOARDING",
  },
  { label: "Incidents", href: "/incidents", module: "INCIDENTS", page: "INCIDENTS" },
  {
    label: "Forms & documents",
    href: "/forms-documents",
    page: "FORMS_DOCUMENTS",
  },
  { label: "Finance", href: "/finance", module: "FINANCE", page: "FINANCE" },
  { label: "Insights", href: "/insights", module: "DASHBOARD", page: "INSIGHTS" },
];

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
      { label: "Demo Requests", href: "/super-admin/demos" },
      { label: "Payments", href: "/super-admin/payments" },
      { label: "Audit log", href: "/super-admin/audit" },
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
          {
            label: "Service line tasks",
            href: "/org-admin/settings/service-tasks",
            module: "SERVICE_DELIVERY",
          },
          { label: "Security", href: "/org-admin/settings/password" },
        ],
      },
      { label: "Payments", href: "/org-admin/payments" },
    ],
  },
  {
    title: "Operations",
    items: FEATURE_PAGES,
  },
];

const managerNav: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/manager", module: "DASHBOARD" }],
  },
  {
    title: "My work",
    items: MY_WORK_PAGES,
  },
  {
    title: "Operations",
    items: FEATURE_PAGES,
  },
  {
    title: "Account",
    items: [{ label: "Your profile", href: "/manager/profile" }],
  },
];

const rosterNav: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/roster", module: "DASHBOARD" }],
  },
  {
    title: "My work",
    items: MY_WORK_PAGES,
  },
  {
    title: "Operations",
    items: FEATURE_PAGES,
  },
  {
    title: "Account",
    items: [{ label: "Your profile", href: "/roster/profile" }],
  },
];

const employeeNav: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/employee", module: "DASHBOARD" }],
  },
  {
    title: "My work",
    items: MY_WORK_PAGES,
  },
  {
    title: "Operations",
    items: FEATURE_PAGES,
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
  // Sibling routes under the same parent (e.g. /organisations/new vs /organisations)
  // must not light up the list item as active.
  const excludedSegments = new Set(["register", "new"]);
  return !excludedSegments.has(firstSegment);
}
