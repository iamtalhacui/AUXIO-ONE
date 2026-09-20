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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
