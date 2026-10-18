import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from 'database';
import {
  ACTION_PERMISSIONS,
  buildDefaultMatrix,
  CONFIGURABLE_ROLES,
  fullPermissions,
  isConfigurableRole,
  isPersonalWorkerAction,
  mergeRolePermissions,
  PAGE_PERMISSIONS,
  sanitizeRolePermissionsInput,
  type ActionPermission,
  type ConfigurableRole,
  type PagePermission,
  type RolePermissionMatrix,
  type RolePermissions,
} from 'database/role-permissions';
import { PrismaService } from '../../common/prisma/prisma.service';

type CachedMatrix = {
  matrix: RolePermissionMatrix;
  loadedAt: number;
};

@Injectable()
export class PermissionsService {
  private readonly cache = new Map<string, CachedMatrix>();
  private readonly cacheTtlMs = 30_000;

  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    organisationId: string,
    role: string,
  ): Promise<RolePermissions> {
    if (role === 'ORG_ADMIN') {
      // Full ops access, but not a rostered field worker by default.
      const full = fullPermissions();
      for (const action of Object.keys(full.actions) as ActionPermission[]) {
        if (isPersonalWorkerAction(action)) {
          full.actions[action] = false;
        }
      }
      return full;
    }
    if (!isConfigurableRole(role)) {
      return {
        pages: Object.fromEntries(
          PAGE_PERMISSIONS.map((id) => [id, false]),
        ) as RolePermissions['pages'],
        actions: Object.fromEntries(
          ACTION_PERMISSIONS.map((id) => [id, false]),
        ) as RolePermissions['actions'],
      };
    }

    const matrix = await this.getMatrix(organisationId);
    return matrix[role];
  }

  async getMatrix(organisationId: string): Promise<RolePermissionMatrix> {
    const cached = this.cache.get(organisationId);
    if (cached && Date.now() - cached.loadedAt < this.cacheTtlMs) {
      return cached.matrix;
    }

    const rows = await this.prisma.organisationRolePermission.findMany({
      where: { organisationId },
    });

    const matrix = buildDefaultMatrix();
    for (const row of rows) {
      if (!isConfigurableRole(row.role)) continue;
      matrix[row.role] = mergeRolePermissions(row.role, {
        pages: row.pages,
        actions: row.actions,
      });
    }

    this.cache.set(organisationId, { matrix, loadedAt: Date.now() });
    return matrix;
  }

  async updateMatrix(
    organisationId: string,
    actorRole: string,
    input: Partial<
      Record<
        ConfigurableRole,
        {
          pages?: Partial<Record<string, boolean>>;
          actions?: Partial<Record<string, boolean>>;
        }
      >
    >,
  ): Promise<RolePermissionMatrix> {
    if (actorRole !== 'ORG_ADMIN') {
      throw new ForbiddenException(
        'Only organisation administrators can edit role permissions',
      );
    }

    if (!input || typeof input !== 'object') {
      throw new BadRequestException('Permission matrix is required');
    }

    for (const role of CONFIGURABLE_ROLES) {
      const roleInput = input[role];
      if (!roleInput) continue;

      const sanitized = sanitizeRolePermissionsInput(role, roleInput);
      await this.prisma.organisationRolePermission.upsert({
        where: {
          organisationId_role: { organisationId, role },
        },
        create: {
          organisationId,
          role,
          pages: sanitized.pages as Prisma.InputJsonValue,
          actions: sanitized.actions as Prisma.InputJsonValue,
        },
        update: {
          pages: sanitized.pages as Prisma.InputJsonValue,
          actions: sanitized.actions as Prisma.InputJsonValue,
        },
      });
    }

    this.invalidate(organisationId);
    return this.getMatrix(organisationId);
  }

  async assertPage(
    organisationId: string,
    role: string,
    page: PagePermission,
  ): Promise<void> {
    if (role === 'ORG_ADMIN') return;
    const perms = await this.resolve(organisationId, role);
    if (!perms.pages[page]) {
      throw new ForbiddenException(`Missing page permission: ${page}`);
    }
  }

  async assertAction(
    organisationId: string,
    role: string,
    action: ActionPermission,
  ): Promise<void> {
    if (!(await this.hasAction(organisationId, role, action))) {
      throw new ForbiddenException(`Missing action permission: ${action}`);
    }
  }

  async hasAction(
    organisationId: string,
    role: string,
    action: ActionPermission,
  ): Promise<boolean> {
    const perms = await this.resolve(organisationId, role);
    return Boolean(perms.actions[action]);
  }

  async assertAnyAction(
    organisationId: string,
    role: string,
    actions: ActionPermission[],
  ): Promise<void> {
    for (const action of actions) {
      if (await this.hasAction(organisationId, role, action)) return;
    }
    throw new ForbiddenException(
      `Missing action permission: ${actions.join(' or ')}`,
    );
  }

  async hasPage(
    organisationId: string,
    role: string,
    page: PagePermission,
  ): Promise<boolean> {
    if (role === 'ORG_ADMIN') return true;
    const perms = await this.resolve(organisationId, role);
    return Boolean(perms.pages[page]);
  }

  invalidate(organisationId: string) {
    this.cache.delete(organisationId);
  }
}
