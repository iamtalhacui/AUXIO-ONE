import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { OrganisationCoreService } from './organisation-core.service';
import { OrgRolesService } from '../roles/org-roles.service';
import {
  ModuleCeilingTemplate,
  resolveModuleCeilingCodes,
} from './module-ceiling.constants';

import { RequirementSetService } from './requirement-set.service';
import { InviteTokenService } from '../../common/invite/invite-token.service';
import { InviteEmailService } from '../../common/mail/invite-email.service';
import { buildInviteUrl } from '../../common/config/client-url';

@Injectable()
export class SuperAdminOrganisationService {
  constructor(
    private prisma: PrismaService,
    private core: OrganisationCoreService,
    private orgRolesService: OrgRolesService,
    private requirementSetService: RequirementSetService,
    private inviteTokenService: InviteTokenService,
    private inviteEmailService: InviteEmailService,
  ) {}

  async create(dto: CreateOrganisationDto, actorUserId: string) {
    const moduleCodes = resolveModuleCeilingCodes(
      dto.moduleCeilingTemplate,
      dto.moduleCeilingCodes,
    );

    if (moduleCodes.length === 0) {
      throw new BadRequestException(
        'Select at least one module for the custom ceiling template',
      );
    }

    if (dto.moduleCeilingTemplate === ModuleCeilingTemplate.CUSTOM) {
      this.core.validateAssignableModuleCodes(moduleCodes);
    }

    const modules = await this.core.findModulesByCodes(moduleCodes);

    const existingOrgAdmin = await this.prisma.user.findFirst({
      where: { email: dto.orgAdminEmail },
    });
    if (existingOrgAdmin) {
      throw new ConflictException(
        `A user with email ${dto.orgAdminEmail} already exists on the platform`,
      );
    }

    const invite = this.inviteTokenService.generate();

    const result = await this.prisma.$transaction(async (tx) => {
      const organisation = await tx.organisation.create({
        data: {
          legalName: dto.legalName,
          tradingName: dto.tradingName,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone,
          timeZone: dto.timeZone,
          moduleEntitlements: {
            create: modules.map((module) => ({
              moduleId: module.id,
              ceilingGranted: true,
              enabled: false,
              grantedById: actorUserId,
            })),
          },
        },
        include: {
          moduleEntitlements: { include: { module: true } },
        },
      });

      let orgAdminRole = await tx.role.findFirst({
        where: { organisationId: organisation.id, code: 'ORG_ADMIN' },
      });

      if (!orgAdminRole) {
        orgAdminRole = await tx.role.create({
          data: {
            organisationId: organisation.id,
            code: 'ORG_ADMIN',
            name: 'Org Admin',
            isBaseRole: true,
          },
        });
      }

      await this.orgRolesService.provisionOrgRoles(organisation.id, tx);
      await this.requirementSetService.provisionForOrganisation(organisation.id, tx);

      const orgAdmin = await tx.user.create({
        data: {
          organisationId: organisation.id,
          roleId: orgAdminRole.id,
          email: dto.orgAdminEmail,
          name: dto.orgAdminName,
          status: 'INVITED',
          isFirstOrgAdmin: true,
          vouchedBySuperAdmin: true,
          inviteTokenHash: invite.hash,
          inviteExpiresAt: invite.expiresAt,
        },
      });

      await tx.auditEntry.create({
        data: {
          organisationId: organisation.id,
          actorUserId,
          action: 'CREATE',
          entityType: 'Organisation',
          entityId: organisation.id,
          afterJson: {
            id: organisation.id,
            legalName: organisation.legalName,
            moduleCeilingTemplate: dto.moduleCeilingTemplate,
            moduleCeilingCodes: moduleCodes,
          },
        },
      });

      await tx.auditEntry.create({
        data: {
          organisationId: organisation.id,
          actorUserId,
          action: 'CREATE',
          entityType: 'User',
          entityId: orgAdmin.id,
          afterJson: {
            id: orgAdmin.id,
            email: orgAdmin.email,
            name: orgAdmin.name,
            isFirstOrgAdmin: true,
            vouchedBySuperAdmin: true,
          },
        },
      });

      for (const entitlement of organisation.moduleEntitlements) {
        await tx.auditEntry.create({
          data: {
            organisationId: organisation.id,
            actorUserId,
            action: 'CREATE',
            entityType: 'ModuleEntitlement',
            entityId: entitlement.id,
            afterJson: {
              moduleCode: entitlement.module.code,
              moduleName: entitlement.module.name,
              ceilingGranted: true,
              enabled: false,
            },
          },
        });
      }

      return { organisation, orgAdmin };
    });

    const organisationName =
      result.organisation.tradingName ?? result.organisation.legalName;

    const emailResult = await this.inviteEmailService.sendInvite({
      to: result.orgAdmin.email,
      recipientName: result.orgAdmin.name,
      organisationName,
      roleName: 'Organisation Admin',
      inviteUrl: buildInviteUrl(invite.token),
      expiresAt: invite.expiresAt,
    });

    return {
      organisation: {
        id: result.organisation.id,
        legalName: result.organisation.legalName,
        tradingName: result.organisation.tradingName,
        contactEmail: result.organisation.contactEmail,
        moduleCeilingTemplate: dto.moduleCeilingTemplate,
      },
      orgAdmin: {
        id: result.orgAdmin.id,
        email: result.orgAdmin.email,
        name: result.orgAdmin.name,
      },
      moduleEntitlements: result.organisation.moduleEntitlements.map((entitlement) => ({
        moduleCode: entitlement.module.code,
        moduleName: entitlement.module.name,
        ceilingGranted: entitlement.ceilingGranted,
        enabled: entitlement.enabled,
      })),
      inviteEmail: {
        queued: true,
        sent: emailResult.sent,
        ...(emailResult.error ? { error: emailResult.error } : {}),
      },
    };
  }

  async findAll() {
    const organisations = await this.prisma.organisation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        moduleEntitlements: {
          where: { ceilingGranted: true },
          include: { module: true },
        },
        users: {
          where: { isFirstOrgAdmin: true },
          take: 1,
          select: { email: true, name: true },
        },
      },
    });

    return organisations.map((org) => ({
      id: org.id,
      legalName: org.legalName,
      tradingName: org.tradingName,
      contactEmail: org.contactEmail,
      contactPhone: org.contactPhone,
      timeZone: org.timeZone,
      status: org.status,
      createdAt: org.createdAt,
      modulesGranted: org.moduleEntitlements.length,
      modulesEnabled: org.moduleEntitlements.filter((entitlement) => entitlement.enabled)
        .length,
      orgAdminEmail: org.users[0]?.email ?? null,
      orgAdminName: org.users[0]?.name ?? null,
    }));
  }

  async findOneDetail(id: string) {
    await this.core.findOrganisationOrThrow(id);

    const organisation = await this.prisma.organisation.findUniqueOrThrow({
      where: { id },
      include: {
        moduleEntitlements: {
          where: { ceilingGranted: true },
          include: { module: true },
          orderBy: { module: { sortOrder: 'asc' } },
        },
        users: {
          where: { isFirstOrgAdmin: true },
          take: 1,
          select: { id: true, email: true, name: true, status: true },
        },
      },
    });

    return {
      id: organisation.id,
      legalName: organisation.legalName,
      tradingName: organisation.tradingName,
      contactEmail: organisation.contactEmail,
      contactPhone: organisation.contactPhone,
      timeZone: organisation.timeZone,
      tagline: organisation.tagline,
      brandColor: organisation.brandColor,
      logoData: organisation.logoData,
      status: organisation.status,
      createdAt: organisation.createdAt,
      updatedAt: organisation.updatedAt,
      orgAdmin: organisation.users[0] ?? null,
      moduleEntitlements: organisation.moduleEntitlements.map((entitlement) => ({
        moduleCode: entitlement.module.code,
        moduleName: entitlement.module.name,
        ceilingGranted: entitlement.ceilingGranted,
        enabled: entitlement.enabled,
      })),
    };
  }

  async update(id: string, dto: UpdateOrganisationDto, actorUserId: string) {
    const existing = await this.core.findOrganisationOrThrow(id);

    if (dto.contactEmail && dto.contactEmail !== existing.contactEmail) {
      await this.core.assertContactEmailAvailable(dto.contactEmail, id);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.organisation.update({
        where: { id },
        data: {
          legalName: dto.legalName,
          tradingName: dto.tradingName,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone,
          timeZone: dto.timeZone,
          status: dto.status,
        },
      });

      await tx.auditEntry.create({
        data: {
          organisationId: id,
          actorUserId,
          action: 'UPDATE',
          entityType: 'Organisation',
          entityId: id,
          beforeJson: {
            legalName: existing.legalName,
            tradingName: existing.tradingName,
            contactEmail: existing.contactEmail,
            contactPhone: existing.contactPhone,
            timeZone: existing.timeZone,
            status: existing.status,
          },
          afterJson: {
            legalName: result.legalName,
            tradingName: result.tradingName,
            contactEmail: result.contactEmail,
            contactPhone: result.contactPhone,
            timeZone: result.timeZone,
            status: result.status,
          },
        },
      });

      return result;
    });

    return {
      id: updated.id,
      legalName: updated.legalName,
      tradingName: updated.tradingName,
      contactEmail: updated.contactEmail,
      contactPhone: updated.contactPhone,
      timeZone: updated.timeZone,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  }

  async updateModuleCeiling(
    organisationId: string,
    moduleCodes: string[],
    actorUserId: string,
  ) {
    const uniqueCodes = [...new Set(moduleCodes)];
    this.core.validateAssignableModuleCodes(uniqueCodes);
    const modules = await this.core.findModulesByCodes(uniqueCodes);
    await this.core.findOrganisationOrThrow(organisationId);

    const currentEntitlements = await this.prisma.moduleEntitlement.findMany({
      where: { organisationId, ceilingGranted: true },
      include: { module: true },
    });

    const currentCodes = currentEntitlements.map((entitlement) => entitlement.module.code);
    const codesToAdd = uniqueCodes.filter((code) => !currentCodes.includes(code));
    const codesToRemove = currentCodes.filter((code) => !uniqueCodes.includes(code));

    for (const code of codesToRemove) {
      const entitlement = currentEntitlements.find(
        (item) => item.module.code === code,
      );
      if (entitlement?.enabled) {
        throw new BadRequestException(
          `Cannot remove module ${code} while it is enabled. The Org Admin must disable it first.`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      for (const code of codesToRemove) {
        const entitlement = currentEntitlements.find(
          (item) => item.module.code === code,
        )!;

        await tx.moduleEntitlement.update({
          where: { id: entitlement.id },
          data: { ceilingGranted: false, enabled: false },
        });

        await tx.auditEntry.create({
          data: {
            organisationId,
            actorUserId,
            action: 'MODULE_CEILING_REMOVE',
            entityType: 'ModuleEntitlement',
            entityId: entitlement.id,
            afterJson: { moduleCode: code },
          },
        });
      }

      for (const code of codesToAdd) {
        const module = modules.find((item) => item.code === code)!;
        const existing = await tx.moduleEntitlement.findFirst({
          where: { organisationId, moduleId: module.id },
        });

        if (existing) {
          await tx.moduleEntitlement.update({
            where: { id: existing.id },
            data: {
              ceilingGranted: true,
              enabled: false,
              grantedById: actorUserId,
            },
          });

          await tx.auditEntry.create({
            data: {
              organisationId,
              actorUserId,
              action: 'MODULE_CEILING_ADD',
              entityType: 'ModuleEntitlement',
              entityId: existing.id,
              afterJson: { moduleCode: code },
            },
          });
        } else {
          const created = await tx.moduleEntitlement.create({
            data: {
              organisationId,
              moduleId: module.id,
              ceilingGranted: true,
              enabled: false,
              grantedById: actorUserId,
            },
          });

          await tx.auditEntry.create({
            data: {
              organisationId,
              actorUserId,
              action: 'MODULE_CEILING_ADD',
              entityType: 'ModuleEntitlement',
              entityId: created.id,
              afterJson: { moduleCode: code },
            },
          });
        }
      }
    });

    return this.findOneDetail(organisationId);
  }
}
