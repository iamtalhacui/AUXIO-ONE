import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(packageRoot, ".env") });

const prisma = new PrismaClient();

// ─── Module definitions ──────────────────────────────────

const MODULES = [
  { code: "HOME",             name: "Home",             description: "Organisation home dashboard",  isCore: true },
  { code: "CRM",              name: "CRM",              description: "Customer relationship management" },
  { code: "CUSTOMERS",        name: "Customers",        description: "Customer / participant records" },
  { code: "WORKFORCE",        name: "Workforce",        description: "Team and workforce management" },
  { code: "SCHEDULE",         name: "Schedule",         description: "Scheduling and rostering" },
  { code: "SERVICE_DELIVERY", name: "Service Delivery", description: "Service delivery operations" },
  { code: "INCIDENTS",        name: "Incidents",        description: "Incident reporting and tracking" },
  { code: "FINANCE",          name: "Finance Handoff",  description: "Finance and billing handoff" },
  { code: "INSIGHTS",         name: "Insights",         description: "Analytics and reporting" },
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
  for (const mod of MODULES) {
    await prisma.module.upsert({
      where: { code: mod.code },
      update: { name: mod.name, description: mod.description, isCore: mod.isCore ?? false },
      create: { code: mod.code, name: mod.name, description: mod.description, isCore: mod.isCore ?? false },
    });
  }
  console.log(`Seeded ${MODULES.length} modules.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
