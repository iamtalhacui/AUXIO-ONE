import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';
import { PlatformService } from '../platform/platform.service';
import { getEntitledModuleCodes } from './plan-modules';
import type { RegisterOrganisationDto } from './dto/register-organisation.dto';

@Injectable()
export class OrganisationsService {
  private readonly logger = new Logger(OrganisationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly platform: PlatformService,
  ) {}

  /**
   * Registers a new organisation with its admin and module entitlements.
   * Returns the created org, admin user, and the raw setup token.
   */
  async register(dto: RegisterOrganisationDto, actorEmail: string) {
    // Check for duplicate admin email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail.trim().toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Generate setup token: raw token goes in the email link, hash goes in the DB
    const rawToken = randomBytes(32).toString('hex');
    const setupTokenHash = createHash('sha256').update(rawToken).digest('hex');
    const setupTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Get module codes for the selected plan
    const entitledCodes = getEntitledModuleCodes(dto.plan);

    // Fetch matching module records
    const modules = await this.prisma.module.findMany({
      where: { code: { in: [...entitledCodes] } },
    });

    // Create everything in a transaction
    const { organisation, user } = await this.prisma.$transaction(async (tx) => {
      const organisation = await tx.organisation.create({
        data: {
          name: dto.name,
          timezone: dto.timezone,
          email: dto.contactEmail.trim().toLowerCase(),
          phone: dto.contactPhone || null,
          plan: dto.plan,
        },
      });

      const user = await tx.user.create({
        data: {
          organisationId: organisation.id,
          firstName: dto.adminFirstName.trim(),
          lastName: dto.adminLastName.trim(),
          email: dto.adminEmail.trim().toLowerCase(),
          role: 'ORG_ADMIN',
          status: 'INVITED',
          setupTokenHash,
          setupTokenExpiresAt,
        },
      });

      // Create module entitlements (all enabled by default)
      await tx.organisationModule.createMany({
        data: modules.map((mod: { id: string }) => ({
          organisationId: organisation.id,
          moduleId: mod.id,
          enabled: true,
        })),
      });

      return { organisation, user };
    });

    // Send setup email (don't block registration if email fails)
    const adminName = `${user.firstName} ${user.lastName}`;
    try {
      await this.mail.sendSetupEmail(user.email, adminName, rawToken);
    } catch (error) {
      this.logger.error(`Failed to send setup email to ${user.email}`, error);
    }

    // Super Admin action — keep a platform audit row for this registration.
    await this.platform.writeAudit({
      action: 'ORGANISATION_CREATED',
      actorEmail,
      organisationName: organisation.name,
      details: `Plan ${organisation.plan}, ${entitledCodes.length} modules granted`,
    });

    return {
      organisation: {
        id: organisation.id,
        name: organisation.name,
        plan: organisation.plan,
        status: organisation.status,
      },
      admin: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
      },
      modulesEntitled: entitledCodes.length,
    };
  }

  // Super Admin organisation list — tenant metadata only, no org operational records.
  async list() {
    const organisations = await this.prisma.organisation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          where: { role: 'ORG_ADMIN' },
          take: 1,
          select: {
            firstName: true,
            lastName: true,
            email: true,
            status: true,
          },
        },
        organisationModules: { select: { enabled: true } },
      },
    });

    return organisations.map((org) => {
      const admin = org.users[0] ?? null;
      return {
        id: org.id,
        name: org.name,
        timezone: org.timezone,
        email: org.email,
        phone: org.phone,
        plan: org.plan,
        status: org.status,
        createdAt: org.createdAt,
        modulesEnabled: org.organisationModules.filter((m) => m.enabled).length,
        modulesGranted: org.organisationModules.length,
        admin,
      };
    });
  }

  // One organisation for the Super Admin tenant detail page (not org operational data).
  async getById(id: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: 'ORG_ADMIN' },
          take: 1,
          select: {
            firstName: true,
            lastName: true,
            email: true,
            status: true,
          },
        },
        organisationModules: {
          include: {
            module: {
              select: {
                code: true,
                name: true,
                description: true,
                isCore: true,
              },
            },
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    const modules = [...org.organisationModules]
      .sort((a, b) => a.module.name.localeCompare(b.module.name))
      .map((row) => ({
        code: row.module.code,
        name: row.module.name,
        description: row.module.description,
        isCore: row.module.isCore,
        enabled: row.enabled,
      }));

    const admin = org.users[0] ?? null;

    return {
      id: org.id,
      name: org.name,
      timezone: org.timezone,
      email: org.email,
      phone: org.phone,
      plan: org.plan,
      status: org.status,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      modulesEnabled: modules.filter((row) => row.enabled).length,
      modulesGranted: modules.length,
      admin,
      modules,
    };
  }

  /**
   * Plan-entitled modules for this organisation, with current enabled state.
   * Modules not in the plan are omitted — Org Admin cannot toggle those.
   */
  async listOrgModules(organisationId: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { plan: true },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    const entitledCodes = getEntitledModuleCodes(org.plan);

    const catalog = await this.prisma.module.findMany({
      where: { code: { in: [...entitledCodes] } },
      orderBy: { name: 'asc' },
    });

    const rows = await this.prisma.organisationModule.findMany({
      where: { organisationId },
      select: { enabled: true, module: { select: { code: true } } },
    });

    const enabledByCode = new Map(
      rows.map((row: { module: { code: string }; enabled: boolean }) => [
        row.module.code,
        row.enabled,
      ]),
    );

    return catalog.map(
      (mod: {
        code: string;
        name: string;
        description: string;
        isCore: boolean;
      }) => ({
        code: mod.code,
        name: mod.name,
        description: mod.description,
        isCore: mod.isCore,
        enabled: enabledByCode.get(mod.code) ?? false,
      }),
    );
  }

  /**
   * Org Admin only. Can toggle modules that are in the organisation's plan.
   * The enabled flag is stored on OrganisationModule.
   */
  async setModuleEnabled(
    organisationId: string,
    role: string,
    moduleCode: string,
    enabled: boolean,
  ) {
    if (role !== 'ORG_ADMIN') {
      throw new ForbiddenException(
        'Only organisation admins can enable or disable modules',
      );
    }

    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { plan: true },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    const code = moduleCode.trim().toUpperCase();
    const entitled = getEntitledModuleCodes(org.plan);

    if (!entitled.includes(code)) {
      throw new ForbiddenException(
        `Module "${code}" is not included in your organisation's plan`,
      );
    }

    const mod = await this.prisma.module.findUnique({
      where: { code },
    });

    if (!mod) {
      throw new NotFoundException(`Module "${code}" not found`);
    }

    const orgModule = await this.prisma.organisationModule.upsert({
      where: {
        organisationId_moduleId: {
          organisationId,
          moduleId: mod.id,
        },
      },
      update: { enabled },
      create: {
        organisationId,
        moduleId: mod.id,
        enabled,
      },
    });

    return {
      code: mod.code,
      name: mod.name,
      description: mod.description,
      isCore: mod.isCore,
      enabled: orgModule.enabled,
    };
  }

  /**
   * Returns the module codes that an organisation is entitled to
   * based on its current plan.
   */
  async getEntitledModules(organisationId: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { plan: true },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    return getEntitledModuleCodes(org.plan);
  }

  /**
   * Checks whether a module is both entitled by the org's plan
   * AND enabled for the organisation. Throws if not.
   */
  async assertModuleAccess(organisationId: string, moduleCode: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { id: true, plan: true },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    // 1. Is the module in the org's plan?
    const code = moduleCode.trim().toUpperCase();
    const entitled = getEntitledModuleCodes(org.plan);
    if (!entitled.includes(code)) {
      throw new ForbiddenException(
        `Module "${code}" is not included in your organisation's plan`,
      );
    }

    // 2. Is the module enabled for this org?
    const orgModule = await this.prisma.organisationModule.findFirst({
      where: {
        organisationId,
        module: { code },
      },
      select: { enabled: true },
    });

    if (!orgModule || !orgModule.enabled) {
      throw new ForbiddenException(
        `Module "${code}" is not enabled for your organisation`,
      );
    }
  }
}
