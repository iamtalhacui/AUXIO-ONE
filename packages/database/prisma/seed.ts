import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { PLAN_MODULES, isCoreModule } from "../src/plan-modules.js";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(packageRoot, ".env") });

const prisma = new PrismaClient();

// ─── Module definitions ──────────────────────────────────

const MODULES = [
  { code: "DASHBOARD",        name: "Dashboard",        description: "Role dashboards / home overview" },
  { code: "CRM",              name: "CRM",              description: "Customer relationship management" },
  { code: "CUSTOMERS",        name: "Customers",        description: "Customer / participant records" },
  { code: "WORKFORCE",        name: "Workforce",        description: "Team and workforce management" },
  { code: "SCHEDULE",         name: "Schedule",         description: "Scheduling and rostering" },
  { code: "SERVICE_DELIVERY", name: "Service Delivery", description: "Shift execution — start, tasks, notes, finish" },
  { code: "INCIDENTS",        name: "Incidents",        description: "Incident reporting and tracking" },
  { code: "FINANCE",          name: "Finance Handoff",  description: "Timesheet lines and billing-ready handoff" },
] as const;

/** Module codes retired from the catalogue — removed on every seed run. */
const RETIRED_MODULE_CODES = ["HOME", "INSIGHTS"] as const;

// ─── Role permission catalogue ───────────────────────────
// Mirrors apps/client/lib/dashboard/content/org-admin-roles.ts.
// PAGE = can the role open this section. ACTION = what it may change there.
const PERMISSIONS = [
  // Organisation & configuration
  { code: "view_org_settings", type: "PAGE", groupCode: "organisation", groupLabel: "Organisation & configuration", name: "View organisation settings", description: "Read organisation name, contact details, and branding." },
  { code: "edit_org_settings", type: "ACTION", groupCode: "organisation", groupLabel: "Organisation & configuration", name: "Edit organisation settings", description: "Update profile, branding, and organisation-level preferences." },
  { code: "view_module_config", type: "PAGE", groupCode: "organisation", groupLabel: "Organisation & configuration", name: "View module configuration", description: "See which modules are enabled within the org ceiling." },
  { code: "edit_module_config", type: "ACTION", groupCode: "organisation", groupLabel: "Organisation & configuration", name: "Edit module configuration", description: "Enable or disable modules for the organisation." },
  // Team management
  { code: "view_team", type: "PAGE", groupCode: "team", groupLabel: "Team management", name: "View team members", description: "See the list of users and their roles in the organisation." },
  { code: "invite_team_members", type: "ACTION", groupCode: "team", groupLabel: "Team management", name: "Invite team members", description: "Send invitations and assign roles to new users." },
  { code: "deactivate_team_members", type: "ACTION", groupCode: "team", groupLabel: "Team management", name: "Deactivate team members", description: "Suspend or remove access for existing users." },
  // Participants
  { code: "view_assigned_participants", type: "PAGE", groupCode: "participants", groupLabel: "Participants", name: "View assigned participants", description: "See participants linked to the user's own shifts." },
  { code: "view_all_participants", type: "PAGE", groupCode: "participants", groupLabel: "Participants", name: "View all participant records", description: "Browse every participant in the organisation." },
  { code: "edit_participant_records", type: "ACTION", groupCode: "participants", groupLabel: "Participants", name: "Edit participant records", description: "Update care plans, contacts, and participant details." },
  { code: "create_participants", type: "ACTION", groupCode: "participants", groupLabel: "Participants", name: "Create participants", description: "Onboard new participants into the organisation." },
  // Workforce & compliance
  { code: "view_workforce_compliance", type: "PAGE", groupCode: "workforce", groupLabel: "Workforce & compliance", name: "View workforce compliance", description: "See certifications, expiries, and policy status." },
  { code: "edit_workforce_records", type: "ACTION", groupCode: "workforce", groupLabel: "Workforce & compliance", name: "Edit workforce records", description: "Update worker profiles and compliance documentation." },
  { code: "onboard_workers", type: "ACTION", groupCode: "workforce", groupLabel: "Workforce & compliance", name: "Onboard new workers", description: "Start onboarding workflows for support workers." },
  // Rostering & shifts
  { code: "view_schedules", type: "PAGE", groupCode: "rostering", groupLabel: "Rostering & shifts", name: "View schedules", description: "See published and draft rosters." },
  { code: "create_edit_schedules", type: "ACTION", groupCode: "rostering", groupLabel: "Rostering & shifts", name: "Create & edit schedules", description: "Build rosters and adjust shift timings." },
  { code: "assign_shifts", type: "ACTION", groupCode: "rostering", groupLabel: "Rostering & shifts", name: "Assign shifts", description: "Match workers to shifts and publish assignments." },
  { code: "approve_shift_changes", type: "ACTION", groupCode: "rostering", groupLabel: "Rostering & shifts", name: "Approve shift changes", description: "Review and approve swap or cancellation requests." },
  // Time & attendance
  { code: "view_own_timesheets", type: "PAGE", groupCode: "time", groupLabel: "Time & attendance", name: "View own timesheets", description: "See hours logged for the signed-in user." },
  { code: "view_all_timesheets", type: "PAGE", groupCode: "time", groupLabel: "Time & attendance", name: "View all timesheets", description: "Browse timesheets across the whole workforce." },
  { code: "approve_timesheets", type: "ACTION", groupCode: "time", groupLabel: "Time & attendance", name: "Approve timesheets", description: "Sign off hours before finance handoff." },
  // Care documentation
  { code: "view_progress_notes", type: "PAGE", groupCode: "care", groupLabel: "Care documentation", name: "View progress notes", description: "Read notes recorded for participants." },
  { code: "create_progress_notes", type: "ACTION", groupCode: "care", groupLabel: "Care documentation", name: "Create progress notes", description: "Write shift notes and voice-to-text entries." },
  { code: "view_incidents", type: "PAGE", groupCode: "care", groupLabel: "Care documentation", name: "View incident reports", description: "Access logged incidents and follow-up status." },
  { code: "report_incidents", type: "ACTION", groupCode: "care", groupLabel: "Care documentation", name: "Report incidents", description: "Submit new incident reports from the field." },
  // Documents & forms
  { code: "view_documents", type: "PAGE", groupCode: "documents", groupLabel: "Documents & forms", name: "View documents", description: "Open organisation and participant document libraries." },
  { code: "manage_documents", type: "ACTION", groupCode: "documents", groupLabel: "Documents & forms", name: "Manage documents", description: "Upload, version, and archive documents and forms." },
  // Reporting & exports
  { code: "view_reports", type: "PAGE", groupCode: "reporting", groupLabel: "Reporting & exports", name: "View reports & analytics", description: "Open dashboards and operational reports." },
  { code: "export_data", type: "ACTION", groupCode: "reporting", groupLabel: "Reporting & exports", name: "Export data", description: "Download CSV or PDF extracts for external use." },
  // Finance handoff
  { code: "view_finance_handoff", type: "PAGE", groupCode: "finance", groupLabel: "Finance handoff", name: "View finance handoff", description: "See approved hours and billing line items." },
  { code: "submit_finance_data", type: "ACTION", groupCode: "finance", groupLabel: "Finance handoff", name: "Submit finance data", description: "Push approved records to finance workflows." },
] as const;

async function main() {
  // ── Seed Super Admin ──
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in packages/database/.env",
    );
  }

  const existingAdmin = await prisma.superAdmin.findFirst();
  if (existingAdmin) {
    console.log(`Super Admin already exists (${existingAdmin.email}). Skipping.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    const superAdmin = await prisma.superAdmin.create({
      data: { email, name: "Super Admin", passwordHash },
    });
    console.log(`Seeded Super Admin: ${superAdmin.email}`);
  }

  // ── Seed Modules ──
  // isCore mirrors CORE_MODULES rather than being hand-maintained here, so the
  // catalogue can never disagree with the plan definitions.
  for (const mod of MODULES) {
    const isCore = isCoreModule(mod.code);
    await prisma.module.upsert({
      where: { code: mod.code },
      update: { name: mod.name, description: mod.description, isCore },
      create: {
        code: mod.code,
        name: mod.name,
        description: mod.description,
        isCore,
      },
    });
  }
  console.log(`Seeded ${MODULES.length} modules.`);

  // ── Drop retired modules and their organisation entitlements ──
  const retired = await prisma.module.findMany({
    where: { code: { in: [...RETIRED_MODULE_CODES] } },
    select: { id: true, code: true },
  });

  if (retired.length > 0) {
    const retiredIds = retired.map((mod) => mod.id);
    await prisma.organisationModule.deleteMany({
      where: { moduleId: { in: retiredIds } },
    });
    await prisma.module.deleteMany({ where: { id: { in: retiredIds } } });
    console.log(`Removed retired modules: ${retired.map((m) => m.code).join(", ")}.`);
  }

  // ── Backfill entitlements so existing orgs match their plan ──
  // Plans changed shape (e.g. SERVICE_DELIVERY moved into Basic), so any
  // newly entitled module needs a row or the Org Admin sees it as disabled.
  // CUSTOM orgs only backfill the core set — their add-ons are the rows the
  // Super Admin already granted, and inventing more would widen the plan.
  const catalogue = await prisma.module.findMany({ select: { id: true, code: true } });
  const moduleIdByCode = new Map(catalogue.map((mod) => [mod.code, mod.id]));
  const organisations = await prisma.organisation.findMany({
    select: { id: true, plan: true },
  });

  let backfilled = 0;
  for (const org of organisations) {
    for (const code of PLAN_MODULES[org.plan]) {
      const moduleId = moduleIdByCode.get(code);
      if (!moduleId) continue;

      const existing = await prisma.organisationModule.findUnique({
        where: { organisationId_moduleId: { organisationId: org.id, moduleId } },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.organisationModule.create({
        data: { organisationId: org.id, moduleId, enabled: true },
      });
      backfilled += 1;
    }
  }
  console.log(`Backfilled ${backfilled} organisation module entitlements.`);

  // ── Prune entitlements the org's plan no longer grants ──
  // Only fixed-shape plans can be pruned: on CUSTOM the rows *are* the grant,
  // so an add-on row is legitimate rather than drift.
  let pruned = 0;
  for (const org of organisations) {
    if (org.plan === "CUSTOM") continue;

    const allowed = PLAN_MODULES[org.plan];
    const result = await prisma.organisationModule.deleteMany({
      where: {
        organisationId: org.id,
        module: { code: { notIn: [...allowed] } },
      },
    });
    pruned += result.count;
  }
  console.log(`Pruned ${pruned} out-of-plan organisation module entitlements.`);

  // ── Seed platform settings ──
  await prisma.platformSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", maintenanceMode: false },
  });
  console.log("Seeded platform settings.");

  // ── Seed role permission catalogue ──
  // Catalogue only. Never create RolePermission rows here.
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        type: perm.type,
        groupCode: perm.groupCode,
        groupLabel: perm.groupLabel,
        name: perm.name,
        description: perm.description,
      },
      create: {
        code: perm.code,
        type: perm.type,
        groupCode: perm.groupCode,
        groupLabel: perm.groupLabel,
        name: perm.name,
        description: perm.description,
      },
    });
  }
  console.log(`Seeded ${PERMISSIONS.length} permissions.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
