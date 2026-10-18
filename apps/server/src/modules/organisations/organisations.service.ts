import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { readFileSync } from 'fs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LocalFileStorageService } from '../../common/storage/local-file-storage.service';
import { MailService } from '../../common/mail/mail.service';
import { PlatformService } from '../platform/platform.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  isCoreModule,
  isOptionalModule,
  resolveEntitledModuleCodes,
} from './plan-modules';
import type { RegisterOrganisationDto } from './dto/register-organisation.dto';
import type { UpdateOrganisationDto } from './dto/update-organisation.dto';
import {
  calculateNextRenewalDate,
  defaultSubscriptionAmountCents,
  toSubscriptionDto,
  toUtcDateOnly,
} from './subscription.util';

const ALLOWED_LOGO_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
]);

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

type LogoUpload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
};

@Injectable()
export class OrganisationsService {
  private readonly logger = new Logger(OrganisationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly platform: PlatformService,
    private readonly storage: LocalFileStorageService,
    private readonly notifications: NotificationsService,
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

    // CUSTOM lets the Super Admin pick add-ons on top of the core set. The core
    // modules come along regardless, so only the add-ons need validating.
    const requestedAddOns = (dto.moduleCodes ?? []).map((code) =>
      code.trim().toUpperCase(),
    );

    if (dto.plan !== 'CUSTOM' && requestedAddOns.length > 0) {
      throw new BadRequestException(
        'Module selection is only accepted for the Custom plan',
      );
    }

    const invalidAddOns = requestedAddOns.filter(
      (code) => !isOptionalModule(code),
    );

    if (invalidAddOns.length > 0) {
      throw new BadRequestException(
        `Not selectable modules: ${invalidAddOns.join(', ')}`,
      );
    }

    const entitledCodes = resolveEntitledModuleCodes(dto.plan, requestedAddOns);

    // Fetch matching module records
    const modules = await this.prisma.module.findMany({
      where: { code: { in: [...entitledCodes] } },
    });

    let startDate: Date;
    try {
      startDate = toUtcDateOnly(dto.startDate);
    } catch {
      throw new BadRequestException('startDate must be a valid date (YYYY-MM-DD)');
    }
    const nextRenewalDate = calculateNextRenewalDate(startDate, dto.billingCycle);
    const gracePeriodDays = dto.gracePeriodDays ?? 3;

    // Create everything in a transaction
    const { organisation, user, subscription } = await this.prisma.$transaction(
      async (tx) => {
        const organisation = await tx.organisation.create({
          data: {
            name: dto.name,
            timezone: dto.timezone,
            email: dto.contactEmail.trim().toLowerCase(),
            phone: dto.contactPhone || null,
            plan: dto.plan,
          },
        });

        const subscription = await tx.subscription.create({
          data: {
            organisationId: organisation.id,
            plan: dto.plan,
            billingCycle: dto.billingCycle,
            amountCents: defaultSubscriptionAmountCents(
              dto.plan,
              dto.billingCycle,
            ),
            currency: 'AUD',
            startDate,
            currentPeriodStart: startDate,
            currentPeriodEnd: nextRenewalDate,
            nextRenewalDate,
            autoRenewal: dto.autoRenewal,
            status: 'ACTIVE',
            gracePeriodDays,
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
            platformApproved: false,
            onboardingStatus: 'VERIFIED',
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

        return { organisation, user, subscription };
      },
    );

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
      details: `Plan ${organisation.plan}, ${dto.billingCycle}, renews ${nextRenewalDate.toISOString().slice(0, 10)}, ${entitledCodes.length} modules granted`,
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
      subscription: toSubscriptionDto(subscription),
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
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            platformApproved: true,
            passwordHash: true,
          },
        },
        organisationModules: { select: { enabled: true } },
        subscription: true,
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
        subscription: org.subscription
          ? toSubscriptionDto(org.subscription)
          : null,
        admin: admin
          ? {
              id: admin.id,
              firstName: admin.firstName,
              lastName: admin.lastName,
              email: admin.email,
              status: admin.status,
              platformApproved: admin.platformApproved,
              approvalStatus: this.toAdminApprovalStatus(admin),
            }
          : null,
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
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            platformApproved: true,
            passwordHash: true,
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
        subscription: true,
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
      subscription: org.subscription
        ? toSubscriptionDto(org.subscription)
        : null,
      admin: admin
        ? {
            id: admin.id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            status: admin.status,
            platformApproved: admin.platformApproved,
            approvalStatus: this.toAdminApprovalStatus(admin),
          }
        : null,
      modules,
    };
  }

  async getSubscription(organisationId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organisationId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found for this organisation');
    }

    return toSubscriptionDto(subscription);
  }

  // Super Admin confirms the Org Admin after they set a password.
  async approveOrgAdmin(organisationId: string, actorEmail: string) {
    const { org, admin } = await this.getOrgAdminPair(organisationId);

    if (admin.status !== 'ACTIVE' || !admin.passwordHash) {
      throw new BadRequestException(
        'Org Admin must set a password before they can be approved',
      );
    }

    if (admin.platformApproved) {
      return this.getById(organisationId);
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: admin.id },
        data: { platformApproved: true, status: 'ACTIVE' },
      }),
      this.prisma.organisation.update({
        where: { id: org.id },
        data: { status: 'ACTIVE' },
      }),
    ]);

    await this.platform.writeAudit({
      action: 'ORG_ADMIN_APPROVED',
      actorEmail,
      organisationName: org.name,
      details: `Approved Org Admin ${admin.email}`,
    });

    void this.notifications.notifyUser(admin.id, organisationId, {
      type: 'SUCCESS',
      title: 'Account approved',
      message: 'Your organisation admin account has been approved. Welcome aboard!',
    });

    return this.getById(organisationId);
  }

  // Block this admin and suspend the org until a correct admin is approved.
  async rejectOrgAdmin(organisationId: string, actorEmail: string) {
    const { org, admin } = await this.getOrgAdminPair(organisationId);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: admin.id },
        data: {
          platformApproved: false,
          status: 'SUSPENDED',
          setupTokenHash: null,
          setupTokenExpiresAt: null,
        },
      }),
      this.prisma.organisation.update({
        where: { id: org.id },
        data: { status: 'SUSPENDED' },
      }),
    ]);

    await this.platform.writeAudit({
      action: 'ORG_ADMIN_REJECTED',
      actorEmail,
      organisationName: org.name,
      details: `Rejected Org Admin ${admin.email}`,
    });

    void this.notifications.notifyUser(admin.id, organisationId, {
      type: 'ERROR',
      title: 'Account rejected',
      message: 'Your organisation admin account approval was rejected by the platform team.',
    });

    return this.getById(organisationId);
  }

  // Same Org Admin row: replace email, clear credentials, resend invite.
  async changeOrgAdminEmail(
    organisationId: string,
    actorEmail: string,
    dto: { adminEmail: string; adminFirstName?: string; adminLastName?: string },
  ) {
    const { org, admin } = await this.getOrgAdminPair(organisationId);
    const nextEmail = dto.adminEmail.trim().toLowerCase();

    if (nextEmail !== admin.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: nextEmail },
      });
      if (existing) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    const rawToken = randomBytes(32).toString('hex');
    const setupTokenHash = createHash('sha256').update(rawToken).digest('hex');
    const setupTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updatedAdmin = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: admin.id },
        data: {
          email: nextEmail,
          firstName: dto.adminFirstName?.trim() || admin.firstName,
          lastName: dto.adminLastName?.trim() || admin.lastName,
          passwordHash: null,
          status: 'INVITED',
          platformApproved: false,
          emailVerifiedAt: null,
          lastLoginAt: null,
          setupTokenHash,
          setupTokenExpiresAt,
        },
      });

      await tx.organisation.update({
        where: { id: org.id },
        data: { status: 'SUSPENDED' },
      });

      return user;
    });

    const adminName = `${updatedAdmin.firstName} ${updatedAdmin.lastName}`;
    try {
      await this.mail.sendSetupEmail(updatedAdmin.email, adminName, rawToken);
    } catch (error) {
      this.logger.error(
        `Failed to send setup email to ${updatedAdmin.email}`,
        error,
      );
    }

    await this.platform.writeAudit({
      action: 'ORG_ADMIN_EMAIL_CHANGED',
      actorEmail,
      organisationName: org.name,
      details: `Org Admin email changed from ${admin.email} to ${updatedAdmin.email}`,
    });

    return this.getById(organisationId);
  }

  private async getOrgAdminPair(organisationId: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      include: {
        users: {
          where: { role: 'ORG_ADMIN' },
          take: 1,
        },
      },
    });

    if (!org) throw new NotFoundException('Organisation not found');
    const admin = org.users[0];
    if (!admin) throw new NotFoundException('Org Admin not found');
    return { org, admin };
  }

  private toAdminApprovalStatus(admin: {
    status: string;
    platformApproved: boolean;
    passwordHash: string | null;
  }) {
    if (admin.platformApproved) return 'APPROVED';
    if (admin.status === 'SUSPENDED') return 'REJECTED';
    if (admin.status === 'ACTIVE' && admin.passwordHash) return 'AWAITING_APPROVAL';
    return 'INVITED';
  }

  /**
   * Plan-entitled modules for this organisation, with current enabled state.
   * Modules not in the plan are omitted — Org Admin cannot toggle those.
   */
  /**
   * Full module entitlement for one organisation. CUSTOM plans read their
   * add-ons from the granted rows; every plan keeps the core set.
   */
  private async resolveEntitlement(organisationId: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { plan: true },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    const granted =
      org.plan === 'CUSTOM'
        ? await this.prisma.organisationModule.findMany({
            where: { organisationId },
            select: { module: { select: { code: true } } },
          })
        : [];

    return {
      plan: org.plan,
      codes: resolveEntitledModuleCodes(
        org.plan,
        granted.map((row: { module: { code: string } }) => row.module.code),
      ),
    };
  }

  async listOrgModules(organisationId: string) {
    const { codes: entitledCodes } =
      await this.resolveEntitlement(organisationId);

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
        // Core modules are on by definition, so a missing or stale row must
        // never present them as switched off.
        enabled: mod.isCore ? true : (enabledByCode.get(mod.code) ?? false),
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

    const code = moduleCode.trim().toUpperCase();
    const { codes: entitled } = await this.resolveEntitlement(organisationId);

    if (!entitled.includes(code)) {
      throw new ForbiddenException(
        `Module "${code}" is not included in your organisation's plan`,
      );
    }

    if (isCoreModule(code)) {
      throw new ForbiddenException(
        `Module "${code}" is part of every plan and cannot be turned off`,
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
    const { codes } = await this.resolveEntitlement(organisationId);
    return codes;
  }

  /**
   * Checks whether a module is both entitled by the org's plan
   * AND enabled for the organisation. Throws if not.
   */
  async assertModuleAccess(organisationId: string, moduleCode: string) {
    // 1. Is the module in the org's plan?
    const code = moduleCode.trim().toUpperCase();
    const { codes: entitled } = await this.resolveEntitlement(organisationId);
    if (!entitled.includes(code)) {
      throw new ForbiddenException(
        `Module "${code}" is not included in your organisation's plan`,
      );
    }

    // Core modules cannot be switched off, so skip the row lookup entirely —
    // a missing row must not lock an organisation out of its own plan.
    if (isCoreModule(code)) return;

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

  async getOrganisation(organisationId: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });
    if (!org) throw new NotFoundException('Organisation not found');
    return this.toOrgProfileDto(org);
  }

  /**
   * Org Admin home dashboard aggregate — team, onboarding, shift approvals,
   * and modules. Mirrors PlatformService.getOverview()'s shape/approach but
   * scoped to a single organisation and only the data Org Admin already
   * has API access to (no Customers/CRM).
   */
  async getOrgAdminOverview(organisationId: string, role: string) {
    this.assertOrgAdmin(role);

    const now = new Date();
    const teamWindowStart = startOfUtcDay(
      new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
    );
    const approvalWindowStart = new Date(
      now.getTime() - 29 * 24 * 60 * 60 * 1000,
    );

    const [org, users, pendingOnboarding, approvalShifts, moduleRows] =
      await Promise.all([
        this.prisma.organisation.findUnique({
          where: { id: organisationId },
          select: { name: true, plan: true, status: true },
        }),
        this.prisma.user.findMany({
          where: { organisationId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true,
            onboardingStatus: true,
            createdAt: true,
            setupTokenExpiresAt: true,
          },
        }),
        this.prisma.onboardingSubmission.findMany({
          where: { organisationId, status: 'PENDING_REVIEW' },
          orderBy: { submittedAt: 'asc' },
          select: {
            userId: true,
            submittedAt: true,
            user: { select: { firstName: true, lastName: true, role: true } },
          },
        }),
        this.prisma.shift.findMany({
          where: {
            organisationId,
            actualEndedAt: { gte: approvalWindowStart },
            status: { in: ['APPROVED', 'REJECTED'] },
          },
          select: { status: true, reviewedById: true },
        }),
        this.prisma.organisationModule.findMany({
          where: { organisationId },
          select: { enabled: true },
        }),
      ]);

    if (!org) throw new NotFoundException('Organisation not found');

    const teamTotal = users.length;
    const teamActive = users.filter((u) => u.status === 'ACTIVE').length;
    const workforceUsers = users.filter((u) => u.role !== 'ORG_ADMIN');

    const joinCounts = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      const day = new Date(teamWindowStart.getTime() + i * 24 * 60 * 60 * 1000);
      joinCounts.set(dateKey(day), 0);
    }
    for (const u of users) {
      const key = dateKey(u.createdAt);
      if (joinCounts.has(key)) {
        joinCounts.set(key, (joinCounts.get(key) ?? 0) + 1);
      }
    }

    const staleInvites = users
      .filter(
        (u) =>
          u.status === 'INVITED' &&
          Boolean(u.setupTokenExpiresAt && u.setupTokenExpiresAt < now),
      )
      .map((u) => ({
        userId: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        invitedAt: u.createdAt,
      }));

    // Org Admin has no onboarding template of its own — funnel/role-mix are
    // workforce-only (MANAGER / ROSTERING_EXPERT / EMPLOYEE).
    const onboardingFunnel = {
      NOT_STARTED: 0,
      IN_PROGRESS: 0,
      PENDING_REVIEW: 0,
      VERIFIED: 0,
      CHANGES_REQUIRED: 0,
    };
    for (const u of workforceUsers) {
      onboardingFunnel[u.onboardingStatus] += 1;
    }

    const roleMix = { MANAGER: 0, ROSTERING_EXPERT: 0, EMPLOYEE: 0 };
    for (const u of workforceUsers) {
      if (
        u.role === 'MANAGER' ||
        u.role === 'ROSTERING_EXPERT' ||
        u.role === 'EMPLOYEE'
      ) {
        roleMix[u.role] += 1;
      }
    }

    const modulesGranted = moduleRows.length;
    const modulesEnabled = moduleRows.filter((m) => m.enabled).length;

    let autoApproved = 0;
    let needsReview = 0;
    let rejected = 0;
    for (const s of approvalShifts) {
      if (s.status === 'REJECTED') rejected += 1;
      else if (s.reviewedById) needsReview += 1;
      else autoApproved += 1;
    }

    const pendingOnboardingReviews = pendingOnboarding.map((s) => ({
      userId: s.userId,
      name: `${s.user.firstName} ${s.user.lastName}`,
      role: s.user.role,
      submittedAt: s.submittedAt ?? now,
    }));

    const awaitingAction =
      pendingOnboardingReviews.length + staleInvites.length;

    return {
      organisation: { name: org.name, plan: org.plan, status: org.status },
      kpis: {
        teamTotal,
        teamActive,
        awaitingAction,
        modulesEnabled,
        modulesGranted,
      },
      teamJoinsLast14Days: [...joinCounts.entries()].map(([date, count]) => ({
        date,
        count,
      })),
      attention: {
        pendingOnboardingReviews,
        staleInvites,
      },
      onboardingFunnel,
      roleMix,
      approvalLoadLast30Days: { autoApproved, needsReview, rejected },
    };
  }

  async updateOrganisation(
    organisationId: string,
    role: string,
    dto: UpdateOrganisationDto,
  ) {
    this.assertOrgAdmin(role);

    const org = await this.prisma.organisation.update({
      where: { id: organisationId },
      data: {
        name: dto.name.trim(),
        tradingName: dto.tradingName?.trim() || null,
        tagline: dto.tagline?.trim() || null,
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone?.trim() || null,
        timezone: dto.timezone.trim(),
      },
    });

    return this.toOrgProfileDto(org);
  }

  async uploadLogo(
    organisationId: string,
    role: string,
    file: LogoUpload | undefined,
  ) {
    this.assertOrgAdmin(role);
    if (!file) {
      throw new BadRequestException('Logo file is required');
    }
    if (!ALLOWED_LOGO_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Logo must be PNG, JPEG, WebP, GIF, or SVG',
      );
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Logo must be 2 MB or smaller');
    }

    const buffer =
      file.buffer ??
      (file.path ? readFileSync(file.path) : undefined);
    if (!buffer?.length) {
      throw new BadRequestException('Logo file is required');
    }

    const existing = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { logoKey: true },
    });
    if (!existing) throw new NotFoundException('Organisation not found');

    const logoKey = this.storage.buildOrgLogoKey({
      organisationId,
      originalName: file.originalname || 'logo.png',
    });
    this.storage.put(logoKey, buffer);

    const org = await this.prisma.organisation.update({
      where: { id: organisationId },
      data: {
        logoKey,
        logoMimeType: file.mimetype,
        logoFileName: file.originalname?.slice(0, 200) || 'logo',
      },
    });

    if (existing.logoKey && existing.logoKey !== logoKey) {
      try {
        this.storage.delete(existing.logoKey);
      } catch {
        this.logger.warn(`Failed to delete old logo ${existing.logoKey}`);
      }
    }

    return this.toOrgProfileDto(org);
  }

  async getLogo(organisationId: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { logoKey: true, logoMimeType: true, logoFileName: true },
    });
    if (!org?.logoKey) throw new NotFoundException('Organisation logo not found');

    const stream = this.storage.openReadStream(org.logoKey);
    return {
      file: new StreamableFile(stream),
      mimeType: org.logoMimeType || 'application/octet-stream',
      fileName: org.logoFileName || 'logo',
    };
  }

  async deleteLogo(organisationId: string, role: string) {
    this.assertOrgAdmin(role);

    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { logoKey: true },
    });
    if (!org) throw new NotFoundException('Organisation not found');

    if (org.logoKey) {
      try {
        this.storage.delete(org.logoKey);
      } catch {
        this.logger.warn(`Failed to delete logo ${org.logoKey}`);
      }
    }

    const updated = await this.prisma.organisation.update({
      where: { id: organisationId },
      data: { logoKey: null, logoMimeType: null, logoFileName: null },
    });

    return this.toOrgProfileDto(updated);
  }

  private assertOrgAdmin(role: string) {
    if (role !== 'ORG_ADMIN') {
      throw new ForbiddenException(
        'Only organisation admins can update organisation settings',
      );
    }
  }

  toOrgProfileDto(org: {
    id: string;
    name: string;
    tradingName: string | null;
    tagline: string | null;
    timezone: string;
    email: string;
    phone: string | null;
    brandColor: string;
    logoKey: string | null;
    plan: string;
    status: string;
  }) {
    return {
      id: org.id,
      name: org.name,
      tradingName: org.tradingName,
      tagline: org.tagline,
      timezone: org.timezone,
      email: org.email,
      phone: org.phone,
      brandColor: org.brandColor,
      hasLogo: Boolean(org.logoKey),
      plan: org.plan,
      status: org.status,
    };
  }
}
