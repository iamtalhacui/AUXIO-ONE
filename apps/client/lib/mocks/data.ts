export type OrgStatus = "ACTIVE" | "SUSPENDED" | "CLOSED";

export type OrganisationListItem = {
  id: string;
  legalName: string;
  tradingName: string | null;
  contactEmail: string;
  contactPhone: string | null;
  timeZone: string;
  status: OrgStatus;
  createdAt: string;
  modulesGranted: number;
  modulesEnabled: number;
  orgAdminEmail: string | null;
  orgAdminName: string | null;
};

export type ModuleEntitlementSummary = {
  moduleCode: string;
  moduleName: string;
  ceilingGranted: boolean;
  enabled: boolean;
};

export type TeamMemberStatus =
  | "INVITED"
  | "MUST_CHANGE_PASSWORD"
  | "ONBOARDING"
  | "PENDING_APPROVAL"
  | "VERIFIED"
  | "SUSPENDED";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: TeamMemberStatus;
  serviceLine: string | null;
  createdAt: string;
};

export type PlatformModule = {
  code: string;
  name: string;
  description: string;
};

export type PlatformInvite = {
  id: string;
  email: string;
  organisationName: string;
  status: string;
  createdAt: string;
};

export type AuditLogItem = {
  id: string;
  action: string;
  actorEmail: string;
  organisationName: string | null;
  createdAt: string;
};

export const mockOrganisations: OrganisationListItem[] = [
  {
    id: "org-1",
    legalName: "Sunrise Care Services Pty Ltd",
    tradingName: "Sunrise Care",
    contactEmail: "admin@sunrisecare.example",
    contactPhone: "+61 2 9000 1001",
    timeZone: "Australia/Sydney",
    status: "ACTIVE",
    createdAt: "2025-11-12T00:00:00.000Z",
    modulesGranted: 6,
    modulesEnabled: 4,
    orgAdminEmail: "admin@sunrisecare.example",
    orgAdminName: "Priya Nair",
  },
  {
    id: "org-2",
    legalName: "Harbour Support NDIS Ltd",
    tradingName: "Harbour Support",
    contactEmail: "hello@harboursupport.example",
    contactPhone: "+61 3 9000 2002",
    timeZone: "Australia/Melbourne",
    status: "ACTIVE",
    createdAt: "2026-01-08T00:00:00.000Z",
    modulesGranted: 4,
    modulesEnabled: 3,
    orgAdminEmail: "hello@harboursupport.example",
    orgAdminName: "James Okonkwo",
  },
  {
    id: "org-3",
    legalName: "Redwood Allied Health Pty Ltd",
    tradingName: null,
    contactEmail: "ops@redwood.example",
    contactPhone: null,
    timeZone: "Australia/Brisbane",
    status: "SUSPENDED",
    createdAt: "2025-08-22T00:00:00.000Z",
    modulesGranted: 3,
    modulesEnabled: 0,
    orgAdminEmail: "ops@redwood.example",
    orgAdminName: "Sam Lee",
  },
];

export const mockModules: PlatformModule[] = [
  { code: "WORKFORCE", name: "Workforce", description: "Onboarding and team directory" },
  { code: "ROSTER", name: "Roster", description: "Scheduling and shift matching" },
  { code: "COMPLIANCE", name: "Compliance", description: "Checks and document tracking" },
  { code: "TIMESHEETS", name: "Timesheets", description: "Shift capture and approval" },
];

export const mockEntitlements: ModuleEntitlementSummary[] = mockModules.map((m, i) => ({
  moduleCode: m.code,
  moduleName: m.name,
  ceilingGranted: true,
  enabled: i < 3,
}));

export const mockTeamMembers: TeamMember[] = [
  {
    id: "tm-1",
    name: "Alex Chen",
    email: "alex.chen@example.com",
    role: "SUPPORT_WORKER",
    status: "VERIFIED",
    serviceLine: "SIL",
    createdAt: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "tm-2",
    name: "Jordan Blake",
    email: "jordan.blake@example.com",
    role: "TEAM_LEADER",
    status: "PENDING_APPROVAL",
    serviceLine: "Community",
    createdAt: "2026-03-10T00:00:00.000Z",
  },
  {
    id: "tm-3",
    name: "Riley Santos",
    email: "riley.santos@example.com",
    role: "SUPPORT_WORKER",
    status: "ONBOARDING",
    serviceLine: "SIL",
    createdAt: "2026-04-02T00:00:00.000Z",
  },
];

export const mockInvites: PlatformInvite[] = [
  {
    id: "inv-1",
    email: "newadmin@example.com",
    organisationName: "Sunrise Care",
    status: "PENDING",
    createdAt: "2026-04-15T00:00:00.000Z",
  },
];

export const mockAuditLog: AuditLogItem[] = [
  {
    id: "aud-1",
    action: "ORGANISATION_CREATED",
    actorEmail: "super@auxio.example",
    organisationName: "Harbour Support",
    createdAt: "2026-01-08T10:00:00.000Z",
  },
  {
    id: "aud-2",
    action: "MODULE_TOGGLED",
    actorEmail: "admin@sunrisecare.example",
    organisationName: "Sunrise Care",
    createdAt: "2026-03-01T08:30:00.000Z",
  },
];

export const mockUser = {
  id: "user-1",
  name: "Alex Chen",
  email: "alex.chen@example.com",
  role: "SUPER_ADMIN",
};
