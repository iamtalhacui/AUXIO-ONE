import { PrismaClient, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

const STATUS_PRIORITY: Record<UserStatus, number> = {
  VERIFIED: 5,
  SUBMITTED: 4,
  PROCESSING: 3,
  INVITED: 2,
  DEACTIVATED: 1,
};

function pickUserToKeep<T extends {
  id: string;
  status: UserStatus;
  passwordHash: string | null;
  isFirstOrgAdmin: boolean;
  organisationId: string | null;
  createdAt: Date;
}>(users: T[]): T {
  return [...users].sort((a, b) => {
    if (a.organisationId === null && b.organisationId !== null) return -1;
    if (b.organisationId === null && a.organisationId !== null) return 1;
    if (a.isFirstOrgAdmin !== b.isFirstOrgAdmin) {
      return a.isFirstOrgAdmin ? -1 : 1;
    }

    const statusDiff = STATUS_PRIORITY[b.status] - STATUS_PRIORITY[a.status];
    if (statusDiff !== 0) return statusDiff;

    if (Boolean(a.passwordHash) !== Boolean(b.passwordHash)) {
      return a.passwordHash ? -1 : 1;
    }

    return a.createdAt.getTime() - b.createdAt.getTime();
  })[0];
}

async function removeDuplicateUser(userId: string) {
  await prisma.workerOnboardingProfile.deleteMany({ where: { userId } });
  await prisma.accessPackage.deleteMany({
    where: { OR: [{ userId }, { grantedById: userId }] },
  });
  await prisma.moduleEntitlement.updateMany({
    where: { grantedById: userId },
    data: { grantedById: null },
  });
  await prisma.auditEntry.updateMany({
    where: { actorUserId: userId },
    data: { actorUserId: null },
  });
  await prisma.user.delete({ where: { id: userId } });
}

async function main() {
  const duplicateEmails = await prisma.$queryRaw<Array<{ email: string }>>`
    SELECT email
    FROM "User"
    GROUP BY email
    HAVING COUNT(*) > 1
  `;

  if (duplicateEmails.length === 0) {
    console.log('No duplicate user emails found.');
    return;
  }

  for (const { email } of duplicateEmails) {
    const users = await prisma.user.findMany({
      where: { email },
      orderBy: { createdAt: 'asc' },
    });

    const keep = pickUserToKeep(users);
    const remove = users.filter((user) => user.id !== keep.id);

    console.log(
      `Email ${email}: keeping ${keep.id}, removing ${remove.map((user) => user.id).join(', ')}`,
    );

    for (const user of remove) {
      await removeDuplicateUser(user.id);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
