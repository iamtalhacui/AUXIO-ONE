import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CONFIGURABLE_ROLE_CODES,
  CONFIGURABLE_ROLE_NAMES,
  ORG_PERMISSION_CODES,
  type ConfigurableRoleCode,
} from '@repo/database';
import type { Prisma } from '@repo/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateOrgRolesDto } from './dto/update-org-roles.dto';

@Injectable()
export class OrgRolesService {
  constructor(private prisma: PrismaService) {}

  async getOrgRoles(organisationId: string) {
    await this.assertOrganisationExists(organisationId);
    await this.ensureOrgRoles(organisationId);

    const roles = await this.prisma.role.findMany({
      where: {
        organisationId,
        code: { in: [...CONFIGURABLE_ROLE_CODES] },
      },
      include: {
        capabilities: { include: { permission: true } },
      },
      orderBy: { code: 'asc' },
    });

    return {
      roles: roles.map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        capabilities: this.buildCapabilityMap(role.capabilities),
      })),
    };
  }

  async updateOrgRoles(
    organisationId: string,
    dto: UpdateOrgRolesDto,
    actorUserId: string,
  ) {
    await this.assertOrganisationExists(organisationId);
    await this.ensureOrgRoles(organisationId);

    this.validatePayload(dto);

    const before = await this.getOrgRoles(organisationId);

    const permissions = await this.prisma.permission.findMany();
    const permissionByCode = Object.fromEntries(
      permissions.map((p) => [p.code, p]),
    );

    await this.prisma.$transaction(async (tx) => {
      for (const rolePayload of dto.roles) {
        const role = await tx.role.findFirst({
          where: { organisationId, code: rolePayload.code },
        });

        if (!role) {
          throw new BadRequestException(`Role ${rolePayload.code} not found`);
        }

        for (const code of ORG_PERMISSION_CODES) {
          const permission = permissionByCode[code];
          if (!permission) continue;

          const allowed = rolePayload.capabilities[code] ?? false;

          await tx.roleCapability.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id,
              },
            },
            create: {
              roleId: role.id,
              permissionId: permission.id,
              allowed,
            },
            update: { allowed },
          });
        }
      }

      await tx.auditEntry.create({
        data: {
          organisationId,
          actorUserId,
          action: 'ROLE_PERMISSIONS_UPDATE',
          entityType: 'OrganisationRoles',
          entityId: organisationId,
          beforeJson: before as Prisma.InputJsonValue,
          afterJson: dto as unknown as Prisma.InputJsonValue,
        },
      });
    });

    return this.getOrgRoles(organisationId);
  }

  async resetOrgRoles(organisationId: string, actorUserId: string) {
    await this.assertOrganisationExists(organisationId);
    await this.ensureOrgRoles(organisationId);

    const before = await this.getOrgRoles(organisationId);

    await this.prisma.$transaction(async (tx) => {
      for (const code of CONFIGURABLE_ROLE_CODES) {
        const orgRole = await tx.role.findFirst({
          where: { organisationId, code },
        });
        const templateRole = await tx.role.findFirst({
          where: { organisationId: null, code },
        });

        if (!orgRole || !templateRole) continue;

        await this.cloneCapabilities(tx, templateRole.id, orgRole.id);
      }

      await tx.auditEntry.create({
        data: {
          organisationId,
          actorUserId,
          action: 'ROLE_PERMISSIONS_RESET',
          entityType: 'OrganisationRoles',
          entityId: organisationId,
          beforeJson: before as Prisma.InputJsonValue,
        },
      });
    });

    return this.getOrgRoles(organisationId);
  }

  async ensureOrgRolesForOrganisation(organisationId: string) {
    await this.ensureOrgRoles(organisationId);
  }

  async provisionOrgRoles(
    organisationId: string,
    tx: Prisma.TransactionClient,
  ) {
    for (const code of CONFIGURABLE_ROLE_CODES) {
      const templateRole = await tx.role.findFirst({
        where: { organisationId: null, code },
      });

      if (!templateRole) continue;

      let orgRole = await tx.role.findFirst({
        where: { organisationId, code },
      });

      if (!orgRole) {
        orgRole = await tx.role.create({
          data: {
            organisationId,
            code,
            name: CONFIGURABLE_ROLE_NAMES[code],
            isBaseRole: true,
          },
        });

        await this.cloneCapabilities(tx, templateRole.id, orgRole.id);
      }
    }
  }

  private async ensureOrgRoles(organisationId: string) {
    await this.prisma.$transaction(async (tx) => {
      await this.provisionOrgRoles(organisationId, tx);
    });
  }

  private async cloneCapabilities(
    tx: Prisma.TransactionClient,
    templateRoleId: string,
    targetRoleId: string,
  ) {
    const templateCaps = await tx.roleCapability.findMany({
      where: { roleId: templateRoleId },
    });

    for (const cap of templateCaps) {
      await tx.roleCapability.upsert({
        where: {
          roleId_permissionId: {
            roleId: targetRoleId,
            permissionId: cap.permissionId,
          },
        },
        create: {
          roleId: targetRoleId,
          permissionId: cap.permissionId,
          allowed: cap.allowed,
        },
        update: { allowed: cap.allowed },
      });
    }
  }

  private buildCapabilityMap(
    capabilities: Array<{ allowed: boolean; permission: { code: string } }>,
  ) {
    const map = Object.fromEntries(
      ORG_PERMISSION_CODES.map((code) => [code, false]),
    );

    for (const cap of capabilities) {
      map[cap.permission.code] = cap.allowed;
    }

    return map;
  }

  private validatePayload(dto: UpdateOrgRolesDto) {
    const codes = new Set(CONFIGURABLE_ROLE_CODES);

    if (dto.roles.length !== CONFIGURABLE_ROLE_CODES.length) {
      throw new BadRequestException('All configurable roles must be included');
    }

    for (const role of dto.roles) {
      if (!codes.has(role.code as ConfigurableRoleCode)) {
        throw new BadRequestException(`Unknown role code: ${role.code}`);
      }

      for (const key of Object.keys(role.capabilities)) {
        if (!ORG_PERMISSION_CODES.includes(key)) {
          throw new BadRequestException(`Unknown permission code: ${key}`);
        }
      }
    }
  }

  private async assertOrganisationExists(organisationId: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { id: true },
    });

    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }
  }
}
