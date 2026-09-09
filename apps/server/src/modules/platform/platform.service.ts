import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

const SETTINGS_ID = 'default';

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
