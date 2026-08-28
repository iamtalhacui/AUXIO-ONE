import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

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

  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in env",
    );
  }

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { organisationId: null, email },
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
