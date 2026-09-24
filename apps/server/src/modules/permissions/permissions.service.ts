import { Injectable, Logger } from '@nestjs/common';
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
