import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { isWorkforceOperationalStatus } from '../../common/user-lifecycle';

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
      select: { roleId: true, status: true, role: { select: { code: true } } },
    });

    if (!user?.roleId) {
      return false;
    }

    if (this.bypassesCapabilityChecks(user.role?.code)) {
      return true;
    }

    if (!isWorkforceOperationalStatus(user.status)) {
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
