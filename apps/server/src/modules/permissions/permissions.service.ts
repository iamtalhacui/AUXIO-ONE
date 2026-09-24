import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Roles an organisation admin can configure. ORG_ADMIN is never configurable. */
export const CONFIGURABLE_ROLES = ['MANAGER', 'ROSTERING_EXPERT', 'EMPLOYEE'] as const;
export type ConfigurableRole = (typeof CONFIGURABLE_ROLES)[number];

const CACHE_TTL_MS = 30_000;

type DisabledCacheEntry = { disabled: Set<string>; expiresAt: number };

/**
 * Resolves what a role is allowed to do inside one organisation.
 *
 * Rules:
 *  - ORG_ADMIN is always allowed. It is never configurable.
 *  - For configurable roles, a permission is allowed unless a RolePermission
 *    row exists for (organisation, role, permission) with enabled = false.
 *    No row means allowed — organisations with no configuration behave
 *    exactly as before this feature existed.
 *  - Unknown roles and unknown permission codes are denied.
 *  - Permissions only restrict. They never grant access that a service's
 *    own role checks refuse.
 */
@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);
  private readonly disabledCache = new Map<string, DisabledCacheEntry>();
  private catalogueCache: { codes: Set<string>; expiresAt: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  isConfigurableRole(role: string): role is ConfigurableRole {
    return (CONFIGURABLE_ROLES as readonly string[]).includes(role);
  }

  async isAllowed(
    organisationId: string,
    role: string,
    permissionCode: string,
  ): Promise<boolean> {
    if (role === 'ORG_ADMIN') return true;
    if (!this.isConfigurableRole(role)) return false;

    const catalogue = await this.getCatalogueCodes();
    if (!catalogue.has(permissionCode)) {
      this.logger.error(
        `Unknown permission code "${permissionCode}" — denying by default`,
      );
      return false;
    }

    const disabled = await this.getDisabledCodes(organisationId, role);
    return !disabled.has(permissionCode);
  }

  /** Every permission code the role currently holds in this organisation. */
  async getEffectivePermissions(
    organisationId: string,
    role: string,
  ): Promise<string[]> {
    const catalogue = await this.getCatalogueCodes();
    if (role === 'ORG_ADMIN') return [...catalogue];
    if (!this.isConfigurableRole(role)) return [];

    const disabled = await this.getDisabledCodes(organisationId, role);
    return [...catalogue].filter((code) => !disabled.has(code));
  }

  /** Call after any change to an organisation's role permissions. */
  invalidate(organisationId: string): void {
    for (const role of CONFIGURABLE_ROLES) {
      this.disabledCache.delete(this.cacheKey(organisationId, role));
    }
  }

  async getMatrix(organisationId: string) {
    const [permissions, disabledRows] = await Promise.all([
      this.prisma.permission.findMany({
        orderBy: [{ createdAt: 'asc' }, { code: 'asc' }],
      }),
      this.prisma.rolePermission.findMany({
        where: { organisationId, enabled: false },
        select: { role: true, permission: { select: { code: true } } },
      }),
    ]);

    const disabledSet = new Set(
      disabledRows.map((row) => `${row.role}:${row.permission.code}`),
    );
    const groups = new Map<
      string,
      {
        groupCode: string;
        groupLabel: string;
        permissions: Array<{
          code: string;
          type: (typeof permissions)[number]['type'];
          name: string;
          description: string;
          roles: Record<ConfigurableRole, boolean>;
        }>;
      }
    >();

    for (const permission of permissions) {
      let group = groups.get(permission.groupCode);
      if (!group) {
        group = {
          groupCode: permission.groupCode,
          groupLabel: permission.groupLabel,
          permissions: [],
        };
        groups.set(permission.groupCode, group);
      }

      const roles = {} as Record<ConfigurableRole, boolean>;
      for (const role of CONFIGURABLE_ROLES) {
        roles[role] = !disabledSet.has(`${role}:${permission.code}`);
      }

      group.permissions.push({
        code: permission.code,
        type: permission.type,
        name: permission.name,
        description: permission.description,
        roles,
      });
    }

    return { roles: [...CONFIGURABLE_ROLES], groups: [...groups.values()] };
  }

  async updateRolePermissions(
    organisationId: string,
    actor: { userId: string; role: string },
    changes: {
      role: ConfigurableRole;
      permissionCode: string;
      enabled: boolean;
    }[],
  ) {
    if (actor.role !== 'ORG_ADMIN') {
      throw new ForbiddenException(
        'Only organisation admins can change role permissions',
      );
    }

    const seen = new Set<string>();
    for (const change of changes) {
      const key = `${change.role}:${change.permissionCode}`;
      if (seen.has(key)) {
        throw new BadRequestException(
          `Duplicate change for ${change.role} / ${change.permissionCode}`,
        );
      }
      seen.add(key);

      if (!this.isConfigurableRole(change.role)) {
        throw new BadRequestException(`Role ${change.role} cannot be configured`);
      }
    }

    const uniqueCodes = [...new Set(changes.map((change) => change.permissionCode))];
    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: uniqueCodes } },
      select: { id: true, code: true },
    });
    const permissionIdByCode = new Map(
      permissions.map((permission) => [permission.code, permission.id]),
    );
    const missing = uniqueCodes.filter((code) => !permissionIdByCode.has(code));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Unknown permission code(s): ${missing.join(', ')}`,
      );
    }

    const existingRows = await this.prisma.rolePermission.findMany({
      where: {
        organisationId,
        permissionId: { in: permissions.map((permission) => permission.id) },
      },
      select: { role: true, permissionId: true, enabled: true },
    });
    const currentValues = new Map(
      existingRows.map((row) => [`${row.role}:${row.permissionId}`, row.enabled]),
    );
    const remaining = changes.filter((change) => {
      const permissionId = permissionIdByCode.get(change.permissionCode)!;
      return change.enabled !== (currentValues.get(`${change.role}:${permissionId}`) ?? true);
    });

    if (remaining.length === 0) return this.getMatrix(organisationId);

    const actorUser = await this.prisma.user.findFirst({
      where: { id: actor.userId, organisationId },
      select: { email: true },
    });
    if (!actorUser) {
      throw new ForbiddenException('Organisation context is required');
    }

    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { name: true },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const change of remaining) {
        const permissionId = permissionIdByCode.get(change.permissionCode)!;
        await tx.rolePermission.upsert({
          where: {
            organisationId_role_permissionId: {
              organisationId,
              role: change.role,
              permissionId,
            },
          },
          update: { enabled: change.enabled, updatedById: actor.userId },
          create: {
            organisationId,
            role: change.role,
            permissionId,
            enabled: change.enabled,
            updatedById: actor.userId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'ROLE_PERMISSIONS_UPDATED',
          actorEmail: actorUser.email,
          organisationName: organisation?.name ?? null,
          details: remaining
            .map(
              (change) =>
                `${change.role} ${change.permissionCode}: ${change.enabled ? 'enabled' : 'disabled'}`,
            )
            .join('; '),
        },
      });
    });

    this.invalidate(organisationId);
    return this.getMatrix(organisationId);
  }

  private cacheKey(organisationId: string, role: string): string {
    return `${organisationId}:${role}`;
  }

  private async getDisabledCodes(
    organisationId: string,
    role: ConfigurableRole,
  ): Promise<Set<string>> {
    const key = this.cacheKey(organisationId, role);
    const cached = this.disabledCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.disabled;

    const rows = await this.prisma.rolePermission.findMany({
      where: { organisationId, role, enabled: false },
      select: { permission: { select: { code: true } } },
    });

    const disabled = new Set(rows.map((row) => row.permission.code));
    this.disabledCache.set(key, {
      disabled,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return disabled;
  }

  private async getCatalogueCodes(): Promise<Set<string>> {
    if (this.catalogueCache && this.catalogueCache.expiresAt > Date.now()) {
      return this.catalogueCache.codes;
    }

    const rows = await this.prisma.permission.findMany({
      select: { code: true },
    });

    const codes = new Set(rows.map((row) => row.code));
    this.catalogueCache = { codes, expiresAt: Date.now() + CACHE_TTL_MS };
    return codes;
  }
}
