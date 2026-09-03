import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(packageRoot, ".env") });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in packages/database/.env",
    );
  }

  const existing = await prisma.superAdmin.findFirst();
  if (existing) {
    console.log(`Super Admin already exists (${existing.email}). Skipping seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const superAdmin = await prisma.superAdmin.create({
    data: {
      email,
      name: "Super Admin",
      passwordHash,
    },
  });

  console.log(`Seeded Super Admin: ${superAdmin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
