import type { UserRole } from "@/lib/dashboard/roles";

export type NavItem = {
  label: string;
  href: string;
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
  subtitle: string;
  sidebarGroups: NavGroup[];
  primaryAction?: {
    label: string;
    href: string;
  };
};

const superAdminNav: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/super-admin" },
      { label: "Organisations", href: "/super-admin/organisations" },
      { label: "Register organisation", href: "/super-admin/organisations/new" },
      { label: "Pending invites", href: "/super-admin/invites" },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "Module catalogue", href: "/super-admin/modules" },
      { label: "Entitlements", href: "/super-admin/entitlements" },
      { label: "Platform settings", href: "/super-admin/settings" },
      { label: "Audit log", href: "/super-admin/audit" },
    ],
  },
  {
    title: "Monitoring",
    items: [
      { label: "Usage & health", href: "/super-admin/health" },
      { label: "Notifications", href: "/super-admin/notifications" },
      { label: "Support access", href: "/super-admin/support" },
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
      { label: "Modules", href: "/org-admin/modules" },
      { label: "Team", href: "/org-admin/team" },
      { label: "Settings", href: "/org-admin/settings" },
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
      { label: "Workforce", href: "/manager/workforce" },
      { label: "Compliance", href: "/manager/compliance" },
    ],
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
      { label: "Schedule", href: "/roster/schedule" },
      { label: "Matching", href: "/roster/matching" },
    ],
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
      { label: "Shifts", href: "/employee/shifts" },
      { label: "Timesheets", href: "/employee/timesheets" },
    ],
  },
];

export const DASHBOARD_CONFIGS: DashboardConfig[] = [
  {
    role: "SUPER_ADMIN",
    basePath: "/super-admin",
    roleLabel: "Super Admin",
    title: "Platform Console",
    subtitle: "AUXIO One platform administration",
    sidebarGroups: superAdminNav,
    primaryAction: {
      label: "+ Register org",
      href: "/super-admin/organisations/new",
    },
  },
  {
    role: "ORG_ADMIN",
    basePath: "/org-admin",
    roleLabel: "Org Admin",
    title: "Organisation Console",
    subtitle: "Manage your organisation settings and modules",
    sidebarGroups: orgAdminNav,
  },
  {
    role: "MANAGER",
    basePath: "/manager",
    roleLabel: "Manager",
    title: "Manager Console",
    subtitle: "Oversee workforce and compliance",
    sidebarGroups: managerNav,
  },
  {
    role: "ROSTERING_EXPERT",
    basePath: "/roster",
    roleLabel: "Rostering Expert",
    title: "Rostering Console",
    subtitle: "Build schedules and match support workers",
    sidebarGroups: rosterNav,
  },
  {
    role: "EMPLOYEE",
    basePath: "/employee",
    roleLabel: "Employee",
    title: "My Dashboard",
    subtitle: "Your shifts, timesheets, and tasks",
    sidebarGroups: employeeNav,
  },
];

export function getDashboardConfigForPath(pathname: string) {
  return DASHBOARD_CONFIGS.find((config) => pathname.startsWith(config.basePath)) ?? null;
}

export function getDashboardConfigForRole(role?: string) {
  return DASHBOARD_CONFIGS.find((config) => config.role === role) ?? null;
}
