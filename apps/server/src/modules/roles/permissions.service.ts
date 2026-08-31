import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

const FULL_ACCESS_ROLES = new Set(['SUPER_ADMIN', 'ORG_ADMIN']);

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  bypassesCapabilityChecks(roleCode?: string) {
    return roleCode && FULL_ACCESS_ROLES.has(roleCode);
  }

  async userHasAnyPermission(userId: string, permissionCodes: string[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true, status: true },
    });

    if (!user?.roleId || user.status !== 'ACTIVE') {
      return false;
    }

    const grant = await this.prisma.roleCapability.findFirst({
      where: {
        roleId: user.roleId,
        allowed: true,
        permission: { code: { in: permissionCodes } },
      },
    });

    return Boolean(grant);
  }
}
