/** Static copy for pages not yet backed by API. */

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
