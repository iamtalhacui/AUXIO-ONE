import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PlatformService {
  constructor(private prisma: PrismaService) {}

  listModules() {
    return this.prisma.module.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        code: true,
        name: true,
        isOperational: true,
        sortOrder: true,
      },
    });
  }

  async listEntitlements() {
    const rows = await this.prisma.moduleEntitlement.findMany({
      where: { ceilingGranted: true },
      include: {
        module: { select: { code: true, name: true } },
        organisation: {
          select: { id: true, legalName: true, tradingName: true },
        },
      },
      orderBy: [
        { organisation: { legalName: 'asc' } },
        { module: { sortOrder: 'asc' } },
      ],
    });

    return rows.map((row) => ({
      id: row.id,
      organisationId: row.organisationId,
      organisationName:
        row.organisation.tradingName ?? row.organisation.legalName,
      moduleCode: row.module.code,
      moduleName: row.module.name,
      ceilingGranted: row.ceilingGranted,
      enabled: row.enabled,
      grantedAt: row.effectiveFrom,
    }));
  }

  async listPendingInvites() {
    const users = await this.prisma.user.findMany({
      where: {
        status: { in: ['INVITED', 'PROCESSING'] },
        organisationId: { not: null },
      },
      include: {
        organisation: { select: { legalName: true, tradingName: true } },
        role: { select: { code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      organisation:
        user.organisation?.tradingName ?? user.organisation?.legalName ?? '—',
      role: user.role?.name ?? '—',
      invitedAt: user.createdAt,
      pendingPasswordChange: user.pendingPasswordChange,
    }));
  }
}
