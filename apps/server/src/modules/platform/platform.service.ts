import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { isOptionalModule } from '../organisations/plan-modules';

const SETTINGS_ID = 'default';

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Super Admin helpers: settings, audit log, module catalogue, entitlements, invites.
@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  // Create the settings row if this is the first time we read it.
  private async getSettingsRow() {
    return this.prisma.platformSetting.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID, maintenanceMode: false },
    });
  }

  /**
   * Aggregated Super Admin home payload — KPIs, attention queue, charts, recent tables.
   * Platform-level only (no per-tenant operational metrics).
   */
  async getOverview() {
    const now = new Date();
    const windowStart = startOfUtcDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));

    const [
      settings,
      organisations,
      demos,
      invitedUsers,
      recentAudit,
      optionalModuleRows,
      optionalCatalogue,
    ] = await Promise.all([
      this.getSettingsRow(),
      this.prisma.organisation.findMany({
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
              createdAt: true,
              setupTokenExpiresAt: true,
            },
          },
          organisationModules: {
            select: {
              enabled: true,
              module: { select: { code: true, name: true, isCore: true } },
            },
          },
        },
      }),
      this.prisma.demoRequest.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          organisationName: true,
          contactName: true,
          preferredDate: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.user.findMany({
        where: { status: 'INVITED' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
          setupTokenExpiresAt: true,
          organisationId: true,
          organisation: { select: { name: true } },
        },
      }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      this.prisma.organisationModule.findMany({
        where: { module: { isCore: false } },
        select: {
          enabled: true,
          module: { select: { code: true, name: true } },
        },
      }),
      this.prisma.module.findMany({
        where: { isCore: false },
        orderBy: { name: 'asc' },
        select: { code: true, name: true },
      }),
    ]);

    const planMix = { BASIC: 0, ADVANCED: 0, CUSTOM: 0 };
    let active = 0;
    let suspended = 0;

    const awaitingApproval: Array<{
      organisationId: string;
      organisationName: string;
      adminName: string;
      adminEmail: string;
      createdAt: Date;
    }> = [];

    const suspendedOrgs: Array<{ id: string; name: string; createdAt: Date }> =
      [];

    const registrationCounts = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const day = new Date(windowStart.getTime() + i * 24 * 60 * 60 * 1000);
      registrationCounts.set(dateKey(day), 0);
    }

    for (const org of organisations) {
      planMix[org.plan] += 1;
      if (org.status === 'ACTIVE') active += 1;
      if (org.status === 'SUSPENDED') {
        suspended += 1;
        suspendedOrgs.push({
          id: org.id,
          name: org.name,
          createdAt: org.createdAt,
        });
      }

      const createdKey = dateKey(org.createdAt);
      if (registrationCounts.has(createdKey)) {
        registrationCounts.set(
          createdKey,
          (registrationCounts.get(createdKey) ?? 0) + 1,
        );
      }

      const admin = org.users[0];
      if (admin) {
        const approval = this.toAdminApprovalStatus(admin);
        if (approval === 'AWAITING_APPROVAL') {
          awaitingApproval.push({
            organisationId: org.id,
            organisationName: org.name,
            adminName: `${admin.firstName} ${admin.lastName}`,
            adminEmail: admin.email,
            createdAt: admin.createdAt,
          });
        }
      }
    }

    const pendingDemos = demos
      .filter((d) => d.status === 'PENDING')
      .map((d) => ({
        id: d.id,
        organisationName: d.organisationName,
        contactName: d.contactName,
        preferredDate: d.preferredDate,
        createdAt: d.createdAt,
      }));

    const demoPipeline = { PENDING: 0, CONTACTED: 0, COMPLETED: 0 };
    for (const d of demos) {
      demoPipeline[d.status] += 1;
    }

    const staleInvites = invitedUsers
      .filter(
        (u) =>
          Boolean(u.setupTokenExpiresAt && u.setupTokenExpiresAt < now),
      )
      .map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        organisationId: u.organisationId,
        organisationName: u.organisation.name,
        invitedAt: u.createdAt,
      }));

    const awaitingAction =
      awaitingApproval.length + pendingDemos.length;

    let dominantPlan: 'BASIC' | 'ADVANCED' | 'CUSTOM' | null = null;
    let dominantCount = 0;
    for (const plan of ['BASIC', 'ADVANCED', 'CUSTOM'] as const) {
      if (planMix[plan] > dominantCount) {
        dominantCount = planMix[plan];
        dominantPlan = plan;
      }
    }
    if (organisations.length === 0) dominantPlan = null;

    const optionalModulesGranted = optionalModuleRows.length;
    const optionalModulesEnabled = optionalModuleRows.filter(
      (r) => r.enabled,
    ).length;

    // Entitled orgs per optional module = orgs that have a grant row for it.
    const adoptionByCode = new Map<
      string,
      { name: string; entitled: number; enabled: number }
    >();
    for (const mod of optionalCatalogue) {
      if (!isOptionalModule(mod.code)) continue;
      adoptionByCode.set(mod.code, {
        name: mod.name,
        entitled: 0,
        enabled: 0,
      });
    }
    for (const org of organisations) {
      for (const row of org.organisationModules) {
        if (row.module.isCore) continue;
        const bucket = adoptionByCode.get(row.module.code);
        if (!bucket) continue;
        bucket.entitled += 1;
        if (row.enabled) bucket.enabled += 1;
      }
    }

    const moduleAdoption = [...adoptionByCode.entries()].map(
      ([code, stats]) => ({
        code,
        name: stats.name,
        entitledOrgs: stats.entitled,
        enabledOrgs: stats.enabled,
        percent:
          stats.entitled === 0
            ? 0
            : Math.round((stats.enabled / stats.entitled) * 100),
      }),
    );

    const recentOrganisations = organisations.slice(0, 5).map((org) => {
      const admin = org.users[0] ?? null;
      return {
        id: org.id,
        name: org.name,
        email: org.email,
        plan: org.plan,
        status: org.status,
        modulesEnabled: org.organisationModules.filter((m) => m.enabled)
          .length,
        modulesGranted: org.organisationModules.length,
        createdAt: org.createdAt,
        adminApprovalStatus: admin
          ? this.toAdminApprovalStatus(admin)
          : null,
      };
    });

    return {
      maintenanceMode: settings.maintenanceMode,
      kpis: {
        organisationsTotal: organisations.length,
        organisationsActive: active,
        organisationsSuspended: suspended,
        awaitingAction,
        planMix,
        dominantPlan,
        optionalModulesEnabled,
        optionalModulesGranted,
      },
      attention: {
        awaitingApproval,
        pendingDemos,
        suspendedOrgs,
        staleInvites,
      },
      registrationsLast30Days: [...registrationCounts.entries()].map(
        ([date, count]) => ({ date, count }),
      ),
      demoPipeline,
      moduleAdoption,
      recentOrganisations,
      recentAudit: recentAudit.map((row) => ({
        id: row.id,
        action: row.action,
        actorEmail: row.actorEmail,
        organisationName: row.organisationName,
        details: row.details,
        createdAt: row.createdAt,
      })),
    };
  }

  private toAdminApprovalStatus(admin: {
    status: string;
    platformApproved: boolean;
    passwordHash: string | null;
  }) {
    if (admin.platformApproved) return 'APPROVED' as const;
    if (admin.status === 'SUSPENDED') return 'REJECTED' as const;
    if (admin.status === 'ACTIVE' && admin.passwordHash) {
      return 'AWAITING_APPROVAL' as const;
    }
    return 'INVITED' as const;
  }

  async getSettings() {
    const row = await this.getSettingsRow();
    return { maintenanceMode: row.maintenanceMode, updatedAt: row.updatedAt };
  }

  // Used by org login and OrgJwtGuard so Super Admin routes stay up.
  async isMaintenanceMode() {
    const row = await this.getSettingsRow();
    return row.maintenanceMode;
  }

  async setMaintenanceMode(maintenanceMode: boolean, actorEmail: string) {
    const row = await this.prisma.platformSetting.upsert({
      where: { id: SETTINGS_ID },
      update: { maintenanceMode },
      create: { id: SETTINGS_ID, maintenanceMode },
    });

    await this.writeAudit({
      action: maintenanceMode ? 'MAINTENANCE_ON' : 'MAINTENANCE_OFF',
      actorEmail,
      details: maintenanceMode
        ? 'Organisation logins are blocked'
        : 'Organisation logins are allowed',
    });

    return { maintenanceMode: row.maintenanceMode, updatedAt: row.updatedAt };
  }

  async writeAudit(entry: {
    action: string;
    actorEmail: string;
    organisationName?: string;
    details?: string;
  }) {
    await this.prisma.auditLog.create({
      data: {
        action: entry.action,
        actorEmail: entry.actorEmail,
        organisationName: entry.organisationName ?? null,
        details: entry.details ?? '',
      },
    });
  }

  async listAudit() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  // Catalogue of all platform modules from the Module table.
  async listModules() {
    return this.prisma.module.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isCore: true,
      },
    });
  }

  // One row per org-module grant, for the entitlements page.
  async listEntitlements() {
    const rows = await this.prisma.organisationModule.findMany({
      orderBy: [{ organisation: { name: 'asc' } }, { module: { name: 'asc' } }],
      include: {
        organisation: { select: { name: true } },
        module: { select: { code: true, name: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      organisationName: row.organisation.name,
      moduleCode: row.module.code,
      moduleName: row.module.name,
      enabled: row.enabled,
      grantedAt: row.createdAt,
    }));
  }

  // Users who have been invited but have not set a password yet.
  async listInvites() {
    const users = await this.prisma.user.findMany({
      where: { status: 'INVITED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        setupTokenExpiresAt: true,
        organisation: { select: { name: true } },
      },
    });

    const now = new Date();
    return users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      organisationName: user.organisation.name,
      invitedAt: user.createdAt,
      expired: Boolean(user.setupTokenExpiresAt && user.setupTokenExpiresAt < now),
    }));
  }
}
