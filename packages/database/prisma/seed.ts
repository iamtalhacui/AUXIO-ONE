import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import {
  CONFIGURABLE_ROLE_CODES,
  CONFIGURABLE_ROLE_NAMES,
  DEFAULT_ROLE_CAPABILITIES,
  ORG_PERMISSION_CATALOGUE,
} from "../src/org-permissions.js";

const prisma = new PrismaClient();

const MODULES = [
  { code: "01", name: "Platform Administration" },
  { code: "02", name: "Settings & Security" },
  { code: "03", name: "Organisation Setup" },
  { code: "04", name: "Dashboard / Home" },
  { code: "05", name: "Workforce Onboarding & Compliance" },
  { code: "06", name: "Rostering & Matching" },
  { code: "07", name: "Employee Execution & Time" },
  { code: "08", name: "Progress Notes, Voice & Smart Notes" },
  { code: "09", name: "Incident Management" },
  { code: "10", name: "Documents & Forms" },
  { code: "11", name: "Search, Reporting & Analytics" },
  { code: "12", name: "Finance Handoff" },
  { code: "13", name: "Insights & Reports" },
  { code: "14", name: "Quality, Security & Operations" },
  { code: "17", name: "Settings" },
];

async function main() {
  for (const [i, m] of MODULES.entries()) {
    await prisma.module.upsert({
      where: { code: m.code },
      update: { name: m.name },
      create: { code: m.code, name: m.name, sortOrder: i },
    });
  }
  console.log(`Seeded ${MODULES.length} modules`);

  for (const entry of ORG_PERMISSION_CATALOGUE) {
    await prisma.permission.upsert({
      where: { code: entry.code },
      update: {
        groupCode: entry.groupCode,
        label: entry.label,
        description: entry.description,
        sortOrder: entry.sortOrder,
      },
      create: {
        code: entry.code,
        groupCode: entry.groupCode,
        label: entry.label,
        description: entry.description,
        sortOrder: entry.sortOrder,
      },
    });
  }
  console.log(`Seeded ${ORG_PERMISSION_CATALOGUE.length} permissions`);

  const permissions = await prisma.permission.findMany();
  const permissionByCode = Object.fromEntries(permissions.map((p) => [p.code, p]));

  async function seedRoleCapabilities(roleId: string, capabilities: Record<string, boolean>) {
    for (const code of ORG_PERMISSION_CATALOGUE.map((p) => p.code)) {
      const permission = permissionByCode[code];
      if (!permission) continue;

      await prisma.roleCapability.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId: permission.id },
        },
        update: { allowed: capabilities[code] ?? false },
        create: {
          roleId,
          permissionId: permission.id,
          allowed: capabilities[code] ?? false,
        },
      });
    }
  }

  let superAdminRole = await prisma.role.findFirst({
    where: { organisationId: null, code: "SUPER_ADMIN" },
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        organisationId: null,
        code: "SUPER_ADMIN",
        name: "Super Admin",
        isBaseRole: true,
      },
    });
  }

  for (const code of CONFIGURABLE_ROLE_CODES) {
    let templateRole = await prisma.role.findFirst({
      where: { organisationId: null, code },
    });

    if (!templateRole) {
      templateRole = await prisma.role.create({
        data: {
          organisationId: null,
          code,
          name: CONFIGURABLE_ROLE_NAMES[code],
          isBaseRole: true,
        },
      });
    }

    await seedRoleCapabilities(templateRole.id, DEFAULT_ROLE_CAPABILITIES[code]);
  }
  console.log("Seeded platform role templates");

  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in env",
    );
  }

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingSuperAdmin) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        organisationId: null,
        roleId: superAdminRole.id,
        email,
        name: "Super Admin",
        passwordHash,
        status: "ACTIVE",
      },
    });
  }

  console.log("Seeded Super Admin");
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
