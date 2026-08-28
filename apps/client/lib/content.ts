export const site = {
  name: "AUXIO One",
  tagline: "Care operations, configured for how you work.",
  description:
    "A multi-tenant platform for NDIS providers and care organisations — from onboarding to rostering, shifts, and billing-ready handoff.",
  contactEmail: "hello@auxio.one",
} as const;

export const navLinks = [
  { label: "Platform", href: "/#platform" },
  { label: "Workflows", href: "/#workflows" },
  { label: "Roles", href: "/#roles" },
  { label: "Modules", href: "/#modules" },
] as const;

export const hero = {
  eyebrow: "Built for NDIS providers in Australia",
  title: "One platform for compliant care delivery.",
  subtitle:
    "Register your organisation, configure your modules, onboard your team, publish rosters, capture shift time, and hand off billing-ready records — all in one place.",
  primaryCta: "Get started",
  secondaryCta: "See how it works",
} as const;

export const stats = [
  { value: "15", label: "Configurable modules" },
  { value: "5", label: "Built-in roles" },
  { value: "4", label: "Operational stages" },
  { value: "1", label: "Operational spine" },
] as const;

export const stages = [
  {
    step: "01",
    title: "Set up",
    description:
      "Super Admin registers your organisation and grants a module ceiling. Your Org Admin configures branding, roles, and requirement sets.",
  },
  {
    step: "02",
    title: "Bring people in",
    description:
      "Workers and participants are onboarded with evidence-based checklists. Compliance stays current before anyone hits the roster.",
  },
  {
    step: "03",
    title: "Deliver the work",
    description:
      "Rosters are built, published, and worked. Clock in, progress notes, clock out — with approvals where it matters.",
  },
  {
    step: "04",
    title: "Hand off & report",
    description:
      "Approved time becomes billing-ready lines and exports to your accounting system. Insights follow the work.",
  },
] as const;

export const features = [
  {
    title: "Multi-tenant by design",
    description:
      "Every record belongs to one organisation. Roles, modules, and settings are scoped cleanly — no cross-tenant leakage.",
  },
  {
    title: "Module ceiling + toggles",
    description:
      "Super Admin grants what you can use. Org Admin turns modules on or off within that ceiling — data preserved when hidden.",
  },
  {
    title: "One operational spine",
    description:
      "Shift → approved time → timesheet line → billing-ready → export. Simple, auditable, no fan-out.",
  },
  {
    title: "Service line aware",
    description:
      "NDIS and aged care share one platform. Service line changes documents and fields — not screens or code paths.",
  },
  {
    title: "Approval everywhere",
    description:
      "Onboarding, rosters, time, incidents — each workflow has named approvers, mandatory reasons on reopen, and audit trails.",
  },
  {
    title: "Web-first for the field",
    description:
      "Employees work shifts from a phone browser. No native app required for the core operational loop.",
  },
] as const;

export const roles = [
  {
    name: "Super Admin",
    scope: "Platform",
    description: "Registers organisations, sets module ceilings, monitors the platform.",
  },
  {
    name: "Org Admin",
    scope: "Organisation",
    description: "Configures branding, modules, roles, requirement sets, and org settings.",
  },
  {
    name: "Manager",
    scope: "Organisation",
    description: "Approves rosters, time, onboarding reviews, and incident closures.",
  },
  {
    name: "Rostering Expert",
    scope: "Organisation",
    description: "Authors draft rosters and assigns workers — without self-approving changes.",
  },
  {
    name: "Employee",
    scope: "Organisation",
    description: "Works published shifts, writes notes, manages availability, reports incidents.",
  },
] as const;

export const workflows = [
  { code: "W-01", name: "Register an organisation", status: "Live" },
  { code: "W-02", name: "Configure the organisation", status: "In progress" },
  { code: "W-03", name: "Onboard a worker", status: "Planned" },
  { code: "W-07", name: "Onboard a participant", status: "Planned" },
  { code: "W-08", name: "Build & publish roster", status: "Planned" },
  { code: "W-09", name: "Work the shift", status: "Planned" },
  { code: "W-10", name: "Time to billing-ready", status: "Planned" },
] as const;

export const modules = [
  "Platform Administration",
  "Settings & Security",
  "Organisation Setup",
  "Workforce Onboarding",
  "Rostering & Matching",
  "Shift Execution & Time",
  "Incident Management",
  "Documents & Forms",
  "Finance Handoff",
  "Insights & Reports",
] as const;

export const getStarted = {
  eyebrow: "Get started",
  title: "Register your organisation with us.",
  subtitle:
    "AUXIO One is invite-only. Tell us about your organisation and our team will reach out to set up your tenant, module ceiling, and first Org Admin account.",
  emailLabel: "Prefer email?",
  emailNote: "Send your organisation details directly and we will respond within one business day.",
  formTitle: "Request access",
  formNote: "This form opens your email client — no account is created until we confirm with you.",
} as const;
