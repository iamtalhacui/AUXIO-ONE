export const overviewStats = [
  {
    label: "Total organisations",
    value: "12",
    change: "+2.6%",
    changeLabel: "last 30 days",
    positive: true,
    bars: [40, 55, 48, 62, 58, 70, 76],
  },
  {
    label: "Active tenants",
    value: "10",
    change: "+0.8%",
    changeLabel: "last 30 days",
    positive: true,
    bars: [60, 58, 62, 65, 63, 68, 72],
  },
  {
    label: "Pending invites",
    value: "3",
    change: "-1",
    changeLabel: "awaiting activation",
    positive: false,
    bars: [30, 28, 32, 25, 22, 20, 18],
  },
] as const;

export const organisations = [
  {
    id: "1",
    legalName: "Harbour Support Services Pty Ltd",
    tradingName: "Harbour Care",
    contactEmail: "contact@harbourcare.com.au",
    timeZone: "Australia/Sydney",
    status: "ACTIVE" as const,
    modulesGranted: 8,
    modulesEnabled: 5,
    orgAdmin: "admin@harbourcare.com.au",
    createdAt: "28 Aug 2026",
  },
  {
    id: "2",
    legalName: "Northern Pathways NDIS",
    tradingName: "Northern Pathways",
    contactEmail: "hello@northernpathways.com.au",
    timeZone: "Australia/Melbourne",
    status: "ACTIVE" as const,
    modulesGranted: 6,
    modulesEnabled: 4,
    orgAdmin: "ops@northernpathways.com.au",
    createdAt: "21 Aug 2026",
  },
  {
    id: "3",
    legalName: "Summit Aged Care Group",
    tradingName: "Summit Care",
    contactEmail: "admin@summitcare.com.au",
    timeZone: "Australia/Brisbane",
    status: "SUSPENDED" as const,
    modulesGranted: 5,
    modulesEnabled: 0,
    orgAdmin: "lead@summitcare.com.au",
    createdAt: "14 Aug 2026",
  },
  {
    id: "4",
    legalName: "Blue Horizon Supports Pty Ltd",
    tradingName: "Blue Horizon",
    contactEmail: "team@bluehorizon.com.au",
    timeZone: "Australia/Perth",
    status: "ACTIVE" as const,
    modulesGranted: 7,
    modulesEnabled: 6,
    orgAdmin: "admin@bluehorizon.com.au",
    createdAt: "02 Aug 2026",
  },
  {
    id: "5",
    legalName: "Coastal Community Care",
    tradingName: "Coastal Care",
    contactEmail: "info@coastalcare.com.au",
    timeZone: "Australia/Adelaide",
    status: "CLOSED" as const,
    modulesGranted: 4,
    modulesEnabled: 0,
    orgAdmin: "admin@coastalcare.com.au",
    createdAt: "15 Jul 2026",
  },
] as const;

export const recentOrganisations = organisations.slice(0, 3);

export const pendingInvites = [
  {
    id: "1",
    name: "Alex Morgan",
    email: "alex@newprovider.com.au",
    organisation: "Bright Future Supports",
    invitedAt: "27 Aug 2026",
    expiresAt: "03 Sep 2026",
    status: "INVITED" as const,
  },
  {
    id: "2",
    name: "Jordan Lee",
    email: "jordan@carelink.com.au",
    organisation: "CareLink NDIS",
    invitedAt: "25 Aug 2026",
    expiresAt: "01 Sep 2026",
    status: "INVITED" as const,
  },
  {
    id: "3",
    name: "Sam Taylor",
    email: "sam@pathwaycare.com.au",
    organisation: "Pathway Care Group",
    invitedAt: "20 Aug 2026",
    expiresAt: "27 Aug 2026",
    status: "EXPIRED" as const,
  },
] as const;

export const entitlements = [
  {
    id: "1",
    organisation: "Harbour Care",
    moduleCode: "06",
    moduleName: "Rostering & Matching",
    ceilingGranted: true,
    enabled: true,
    grantedAt: "28 Aug 2026",
  },
  {
    id: "2",
    organisation: "Harbour Care",
    moduleCode: "05",
    moduleName: "Workforce Onboarding",
    ceilingGranted: true,
    enabled: false,
    grantedAt: "28 Aug 2026",
  },
  {
    id: "3",
    organisation: "Northern Pathways",
    moduleCode: "07",
    moduleName: "Shift Execution & Time",
    ceilingGranted: true,
    enabled: true,
    grantedAt: "21 Aug 2026",
  },
  {
    id: "4",
    organisation: "Summit Care",
    moduleCode: "09",
    moduleName: "Incident Management",
    ceilingGranted: true,
    enabled: false,
    grantedAt: "14 Aug 2026",
  },
] as const;

export const auditLog = [
  {
    id: "1",
    action: "CREATE",
    entityType: "Organisation",
    entityLabel: "Harbour Care",
    actor: "Super Admin",
    timestamp: "28 Aug 2026, 09:14",
  },
  {
    id: "2",
    action: "CREATE",
    entityType: "User",
    entityLabel: "admin@harbourcare.com.au",
    actor: "Super Admin",
    timestamp: "28 Aug 2026, 09:14",
  },
  {
    id: "3",
    action: "MODULE_ENABLE",
    entityType: "ModuleEntitlement",
    entityLabel: "Rostering & Matching · Harbour Care",
    actor: "Org Admin",
    timestamp: "28 Aug 2026, 11:02",
  },
  {
    id: "4",
    action: "MODULE_DISABLE",
    entityType: "ModuleEntitlement",
    entityLabel: "Workforce Onboarding · Northern Pathways",
    actor: "Org Admin",
    timestamp: "27 Aug 2026, 16:45",
  },
  {
    id: "5",
    action: "CREATE",
    entityType: "Organisation",
    entityLabel: "Northern Pathways",
    actor: "Super Admin",
    timestamp: "21 Aug 2026, 14:30",
  },
] as const;

export const healthMetrics = [
  { label: "API uptime", value: "99.98%", status: "healthy" as const },
  { label: "Database", value: "Connected", status: "healthy" as const },
  { label: "Avg response time", value: "124ms", status: "healthy" as const },
  { label: "Failed jobs (24h)", value: "0", status: "healthy" as const },
] as const;

export const notifications = [
  {
    id: "1",
    title: "New organisation registered",
    body: "Harbour Care was registered with 8 modules in the ceiling.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    title: "Org Admin invite pending",
    body: "Alex Morgan has not activated their account yet.",
    time: "1 day ago",
    read: false,
  },
  {
    id: "3",
    title: "Module ceiling updated",
    body: "Northern Pathways ceiling was widened to include Finance Handoff.",
    time: "3 days ago",
    read: true,
  },
  {
    id: "4",
    title: "Tenant suspended",
    body: "Summit Care was suspended by Super Admin.",
    time: "5 days ago",
    read: true,
  },
] as const;

export const supportRequests = [
  {
    id: "1",
    organisation: "Harbour Care",
    requestedBy: "Super Admin",
    reason: "Investigate module toggle issue",
    status: "ACTIVE" as const,
    expiresAt: "28 Aug 2026, 17:00",
  },
  {
    id: "2",
    organisation: "Northern Pathways",
    requestedBy: "Super Admin",
    reason: "Onboarding checklist review",
    status: "EXPIRED" as const,
    expiresAt: "20 Aug 2026, 12:00",
  },
] as const;

export const reports = [
  {
    id: "1",
    name: "Organisation summary",
    description: "All tenants, status, module counts, and registration dates.",
    format: "CSV",
  },
  {
    id: "2",
    name: "Module adoption",
    description: "Which modules are granted and enabled across all organisations.",
    format: "CSV",
  },
  {
    id: "3",
    name: "Audit trail export",
    description: "Platform audit entries for a selected date range.",
    format: "PDF",
  },
  {
    id: "4",
    name: "Pending invites",
    description: "Org Admins awaiting activation or expired invitations.",
    format: "CSV",
  },
] as const;

export const moduleCatalogue = [
  { code: "01", name: "Platform Administration", operational: false },
  { code: "02", name: "Settings & Security", operational: false },
  { code: "03", name: "Organisation Setup", operational: true },
  { code: "04", name: "Dashboard / Home", operational: false },
  { code: "05", name: "Workforce Onboarding & Compliance", operational: true },
  { code: "06", name: "Rostering & Matching", operational: true },
  { code: "07", name: "Employee Execution & Time", operational: true },
  { code: "08", name: "Progress Notes, Voice & Smart Notes", operational: true },
  { code: "09", name: "Incident Management", operational: true },
  { code: "10", name: "Documents & Forms", operational: true },
  { code: "11", name: "Search, Reporting & Analytics", operational: false },
  { code: "12", name: "Finance Handoff", operational: true },
  { code: "13", name: "Insights & Reports", operational: false },
  { code: "14", name: "Quality, Security & Operations", operational: false },
  { code: "17", name: "Settings", operational: false },
] as const;

export const platformSettings = {
  defaultTimeZone: "Australia/Sydney",
  inviteExpiryDays: 7,
  maxModulesPerOrg: 15,
  supportEmail: "hello@auxio.one",
  maintenanceMode: false,
} as const;

export const featuredWorkflow = {
  tag: "Featured workflow",
  title: "W-01 · Register an organisation",
  description:
    "Create a tenant, grant the module ceiling, and invite the first Org Admin — all in one transaction.",
  cta: "Open register flow",
  href: "/super-admin/organisations/new",
} as const;

export type OrgStatus = (typeof organisations)[number]["status"];
export type InviteStatus = (typeof pendingInvites)[number]["status"];
