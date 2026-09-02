export const site = {
  name: "AUXIO One",
  tagline: "Run your care organisation without the paperwork chaos.",
  description:
    "The all-in-one platform for NDIS providers and care organisations — onboarding, rostering, shift time, compliance, and billing-ready handoff in one place.",
  contactEmail: "hello@auxio.one",
} as const;

export const navLinks = [
  { label: "Product", href: "/#product" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Who it's for", href: "/#roles" },
  { label: "FAQ", href: "/#faq" },
] as const;

export const hero = {
  eyebrow: "Software built for NDIS providers in Australia",
  title: "Care management, without the admin headache.",
  subtitle:
    "AUXIO One brings onboarding, rostering, shift time, incidents, and billing-ready reporting into one platform — so your team spends less time on paperwork and more time delivering great care.",
  primaryCta: "Get started",
  secondaryCta: "See how it works",
  imageAlt: "A support worker helping a participant at home",
} as const;

export const trustBadges = [
  "NDIS-ready compliance workflows",
  "Australian data hosting",
  "Built with real provider workflows",
] as const;

export const stats = [
  { value: "10+", label: "Built-in compliance workflows" },
  { value: "5", label: "Role-based access levels" },
  { value: "100%", label: "Audit trail on every approval" },
  { value: "1", label: "Platform for your whole team" },
] as const;

export const benefits = [
  {
    eyebrow: "Rostering & scheduling",
    title: "Build and publish rosters in minutes, not hours.",
    description:
      "Match the right support worker to the right shift based on skills, availability, and service line — then publish with one click. No more spreadsheets or group chats.",
    points: [
      "Drag-and-drop shift building",
      "Automatic clash and availability checks",
      "Instant notifications when rosters change",
    ],
    image: "benefitScheduling",
    imageAlt: "A coordinator planning schedules in an office",
  },
  {
    eyebrow: "Onboarding & compliance",
    title: "Onboard workers and participants with total confidence.",
    description:
      "Guided, checklist-driven onboarding keeps qualifications, police checks, and care plans current — so nobody is rostered on a shift they're not cleared for.",
    points: [
      "Evidence-based onboarding checklists",
      "Expiry tracking on every credential",
      "Approval workflows with clear ownership",
    ],
    image: "benefitOnboarding",
    imageAlt: "A support worker helping a participant at home",
  },
  {
    eyebrow: "Shift execution",
    title: "Your team can work from a phone, out in the field.",
    description:
      "Support workers clock in, write progress notes, and clock out — right from their phone's browser. No app to install, no training required.",
    points: [
      "Mobile-friendly, no app download",
      "Progress notes captured in real time",
      "Incident reporting on the spot",
    ],
    image: "benefitFieldWork",
    imageAlt: "A caregiver supporting a participant outdoors",
  },
  {
    eyebrow: "Billing-ready reporting",
    title: "Turn approved time into invoices, automatically.",
    description:
      "Every approved shift becomes a clean, exportable line item — ready for your accounting system. No manual re-keying, no reconciliation headaches.",
    points: [
      "One-click export to accounting tools",
      "Full audit trail from shift to invoice",
      "Reports that follow the actual work done",
    ],
    image: "benefitReporting",
    imageAlt: "A team reviewing reports together",
  },
] as const;

export const stages = [
  {
    step: "01",
    title: "Set up your organisation",
    description:
      "We register your organisation, configure your modules, and set up your branding, roles, and requirement sets — tailored to how you operate.",
  },
  {
    step: "02",
    title: "Bring your team & participants in",
    description:
      "Onboard support workers and participants with guided checklists. Compliance stays current before anyone is rostered on.",
  },
  {
    step: "03",
    title: "Roster & deliver care",
    description:
      "Build rosters, publish shifts, and let your team clock in, write notes, and clock out — from any phone.",
  },
  {
    step: "04",
    title: "Get billing-ready reports",
    description:
      "Approved time flows straight into billing-ready exports for your accounting system. Insights follow the work, automatically.",
  },
] as const;

export const features = [
  {
    title: "Secure & multi-tenant",
    description:
      "Every organisation's data is fully isolated. Your records, your roles, your settings — never shared or leaked across tenants.",
  },
  {
    title: "Pay for what you use",
    description:
      "Turn on the modules your organisation needs today. Add more as you grow — nothing to migrate, nothing to lose.",
  },
  {
    title: "Built-in approvals",
    description:
      "Onboarding, rosters, time, and incidents each have clear approvers, mandatory reasons, and a full audit trail.",
  },
  {
    title: "NDIS & aged care ready",
    description:
      "Support NDIS and aged care service lines from one platform — the right forms and fields appear automatically.",
  },
  {
    title: "Role-based access",
    description:
      "Admins, managers, coordinators, and support workers each see exactly what they need — nothing more, nothing less.",
  },
  {
    title: "Australian-hosted",
    description:
      "Your data stays in Australia, with the privacy and reliability that care organisations need to trust their systems.",
  },
] as const;

export const roles = [
  {
    name: "Organisation Admins",
    scope: "Full control",
    description:
      "Configure branding, modules, roles, and requirement sets. See everything happening across the organisation.",
  },
  {
    name: "Managers",
    scope: "Oversight",
    description:
      "Approve rosters, timesheets, onboarding reviews, and incident closures — with full visibility and audit history.",
  },
  {
    name: "Rostering coordinators",
    scope: "Scheduling",
    description:
      "Build draft rosters and assign the right support workers to the right shifts, fast.",
  },
  {
    name: "Support workers",
    scope: "Field delivery",
    description:
      "Work published shifts, write progress notes, manage availability, and report incidents — all from a phone.",
  },
] as const;

export const faqs = [
  {
    question: "Is AUXIO One built specifically for NDIS providers?",
    answer:
      "Yes. AUXIO One is designed around real NDIS provider workflows — onboarding, rostering, shift delivery, incident management, and billing-ready handoff — while also supporting aged care service lines from the same platform.",
  },
  {
    question: "Do support workers need to install an app?",
    answer:
      "No. Support workers can clock in, write progress notes, and manage their shifts from any phone's web browser — no app store download or installation required.",
  },
  {
    question: "How long does it take to get set up?",
    answer:
      "Once you register your interest, our team configures your organisation, module access, and first admin account — most organisations are ready to onboard their team within days.",
  },
  {
    question: "Is our data secure and hosted in Australia?",
    answer:
      "Yes. Every organisation's data is fully isolated from every other tenant, and hosted in Australia to meet the privacy expectations of care organisations.",
  },
  {
    question: "Can we control which features our team can access?",
    answer:
      "Yes. Access is role-based — admins, managers, coordinators, and support workers each see only what's relevant to their role, and you can turn modules on or off as your organisation grows.",
  },
] as const;

export const getStarted = {
  eyebrow: "Get started",
  title: "Bring your organisation onto AUXIO One.",
  subtitle:
    "AUXIO One is currently onboarding new providers directly. Tell us about your organisation and our team will set up your tenant, module access, and first admin account.",
  emailLabel: "Prefer email?",
  emailNote: "Send your organisation details directly and we will respond within one business day.",
  formTitle: "Request access",
  formNote: "This form opens your email client — no account is created until we confirm with you.",
} as const;
