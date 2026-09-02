import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  listForOrganisation(organisationId: string, limit = 100) {
    return this.prisma.auditEntry.findMany({
      where: { organisationId },
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  listPlatformActions(limit = 100) {
    return this.prisma.auditEntry.findMany({
      where: {
        actor: { organisationId: null },
      },
      include: {
        actor: { select: { id: true, name: true, email: true } },
        organisation: { select: { id: true, legalName: true, tradingName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
