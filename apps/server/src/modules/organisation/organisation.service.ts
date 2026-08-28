import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOrganisationDto } from './dto/create-organisation.dto';

@Injectable()
export class OrganisationService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrganisationDto, actorUserId: string) {
    const modules = await this.prisma.module.findMany({
      where: { code: { in: dto.moduleCeilingCodes } },
    });

    if (modules.length !== dto.moduleCeilingCodes.length) {
      const found = modules.map((m) => m.code);
      const missing = dto.moduleCeilingCodes.filter((c) => !found.includes(c));
      throw new BadRequestException(
        `Unknown module codes: ${missing.join(', ')}`,
      );
    }

    const existingOrgAdmin = await this.prisma.user.findFirst({
      where: { email: dto.orgAdminEmail },
    });
    if (existingOrgAdmin) {
      throw new ConflictException(
        `A user with email ${dto.orgAdminEmail} already exists on the platform`,
      );
    }

    const tempPassword = crypto.randomBytes(6).toString('base64url');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const organisation = await tx.organisation.create({
        data: {
          legalName: dto.legalName,
          tradingName: dto.tradingName,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone,
          timeZone: dto.timeZone,
          moduleEntitlements: {
            create: modules.map((m) => ({
              moduleId: m.id,
              ceilingGranted: true,
              enabled: false,
            })),
          },
        },
        include: { moduleEntitlements: true },
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

      const orgAdmin = await tx.user.create({
        data: {
          organisationId: organisation.id,
          roleId: orgAdminRole.id,
          email: dto.orgAdminEmail,
          name: dto.orgAdminName,
          passwordHash,
          status: 'INVITED',
          isFirstOrgAdmin: true,
          vouchedBySuperAdmin: true,
        },
      });

      await tx.auditEntry.create({
        data: {
          organisationId: organisation.id,
          actorUserId,
          action: 'CREATE',
          entityType: 'Organisation',
          entityId: organisation.id,
          afterJson: JSON.parse(JSON.stringify(organisation)),
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

      return { organisation, orgAdmin };
    });

    console.log(
      `[EMAIL STUB] To: ${result.orgAdmin.email} | Temp password: ${tempPassword}`,
    );

    return {
      organisation: result.organisation,
      orgAdmin: {
        id: result.orgAdmin.id,
        email: result.orgAdmin.email,
        name: result.orgAdmin.name,
      },
    };
  }

  findOne(id: string) {
    return this.prisma.organisation.findUniqueOrThrow({
      where: { id },
      include: { moduleEntitlements: { include: { module: true } } },
    });
  }

  async listModuleEntitlements(organisationId: string) {
    return this.prisma.moduleEntitlement.findMany({
      where: { organisationId },
      include: { module: true },
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
      where: { organisationId, moduleId: module.id },
    });

    if (!entitlement || !entitlement.ceilingGranted) {
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
      });

      await tx.auditEntry.create({
        data: {
          organisationId,
          actorUserId,
          action: enabled ? 'MODULE_ENABLE' : 'MODULE_DISABLE',
          entityType: 'ModuleEntitlement',
          entityId: entitlement.id,
          beforeJson: before,
          afterJson: { enabled },
        },
      });

      return result;
    });

    return updated;
  }
}
