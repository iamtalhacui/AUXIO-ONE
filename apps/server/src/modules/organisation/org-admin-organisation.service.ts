import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateOrgAdminProfileDto } from './dto/update-org-admin-profile.dto';
import { OrganisationCoreService } from './organisation-core.service';
import {
  mapOrgAdminProfile,
  orgAdminProfileSelect,
} from './organisation.constants';

@Injectable()
export class OrgAdminOrganisationService {
  constructor(
    private prisma: PrismaService,
    private core: OrganisationCoreService,
  ) {}

  async getOrgAdminProfile(organisationId: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: orgAdminProfileSelect,
    });

    if (!organisation) {
      await this.core.findOrganisationOrThrow(organisationId);
    }

    return mapOrgAdminProfile(organisation!);
  }

  async updateOrgAdminProfile(
    organisationId: string,
    dto: UpdateOrgAdminProfileDto,
    actorUserId: string,
  ) {
    const existing = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: orgAdminProfileSelect,
    });

    if (!existing) {
      await this.core.findOrganisationOrThrow(organisationId);
    }

    if (dto.contactEmail && dto.contactEmail !== existing!.contactEmail) {
      await this.core.assertContactEmailAvailable(
        dto.contactEmail,
        organisationId,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.organisation.update({
        where: { id: organisationId },
        data: {
          legalName: dto.legalName,
          tradingName: dto.tradingName,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone,
          timeZone: dto.timeZone,
          tagline: dto.tagline,
          brandColor: dto.brandColor,
          ...(dto.logoData !== undefined ? { logoData: dto.logoData } : {}),
        },
        select: orgAdminProfileSelect,
      });

      await tx.auditEntry.create({
        data: {
          organisationId,
          actorUserId,
          action: 'UPDATE',
          entityType: 'Organisation',
          entityId: organisationId,
          beforeJson: {
            legalName: existing!.legalName,
            tradingName: existing!.tradingName,
            contactEmail: existing!.contactEmail,
            contactPhone: existing!.contactPhone,
            timeZone: existing!.timeZone,
            tagline: existing!.tagline,
            brandColor: existing!.brandColor,
            hasLogo: Boolean(existing!.logoData),
          },
          afterJson: {
            legalName: result.legalName,
            tradingName: result.tradingName,
            contactEmail: result.contactEmail,
            contactPhone: result.contactPhone,
            timeZone: result.timeZone,
            tagline: result.tagline,
            brandColor: result.brandColor,
            hasLogo: Boolean(result.logoData),
          },
        },
      });

      return result;
    });

    return mapOrgAdminProfile(updated);
  }

  listModuleEntitlements(organisationId: string) {
    return this.prisma.moduleEntitlement.findMany({
      where: { organisationId, ceilingGranted: true },
      include: { module: true },
      orderBy: { module: { sortOrder: 'asc' } },
    });
  }

  async toggleModule(
    organisationId: string,
    moduleCode: string,
    enabled: boolean,
    actorUserId: string,
  ) {
    const module = await this.prisma.module.findUnique({
      where: { code: moduleCode },
    });

    if (!module) {
      throw new BadRequestException(`Unknown module code: ${moduleCode}`);
    }

    const entitlement = await this.prisma.moduleEntitlement.findFirst({
      where: { organisationId, moduleId: module.id, ceilingGranted: true },
    });

    if (!entitlement) {
      throw new BadRequestException(
        `Module ${moduleCode} is not within this organisation's granted ceiling`,
      );
    }

    if (entitlement.enabled === enabled) {
      return entitlement;
    }

    const before = { enabled: entitlement.enabled };

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.moduleEntitlement.update({
        where: { id: entitlement.id },
        data: { enabled },
        include: { module: true },
      });

      await tx.auditEntry.create({
        data: {
          organisationId,
          actorUserId,
          action: enabled ? 'MODULE_ENABLE' : 'MODULE_DISABLE',
          entityType: 'ModuleEntitlement',
          entityId: entitlement.id,
          beforeJson: before,
          afterJson: { enabled, moduleCode },
        },
      });

      return result;
    });

    return updated;
  }
}
