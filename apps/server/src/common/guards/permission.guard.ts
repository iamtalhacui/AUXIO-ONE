import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type {
  ActionPermission,
  PagePermission,
} from 'database/role-permissions';
import { PermissionsService } from '../../modules/permissions/permissions.service';

export const PAGE_PERMISSION_KEY = 'required_page_permission';
export const ACTION_PERMISSION_KEY = 'required_action_permission';

export const RequirePage = (page: PagePermission) =>
  SetMetadata(PAGE_PERMISSION_KEY, page);

export const RequireAction = (action: ActionPermission) =>
  SetMetadata(ACTION_PERMISSION_KEY, action);

/**
 * Enforces @RequirePage / @RequireAction after OrgJwtGuard.
 * ORG_ADMIN bypasses both. Must run after auth so request.user is set.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const page = this.reflector.getAllAndOverride<PagePermission | undefined>(
      PAGE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    const action = this.reflector.getAllAndOverride<
      ActionPermission | undefined
    >(ACTION_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!page && !action) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as
      | { organisationId?: string; role?: string }
      | undefined;

    if (!user?.organisationId || !user.role) {
      throw new ForbiddenException('Organisation context is required');
    }

    if (page) {
      await this.permissions.assertPage(
        user.organisationId,
        user.role,
        page,
      );
    }
    if (action) {
      await this.permissions.assertAction(
        user.organisationId,
        user.role,
        action,
      );
    }

    return true;
  }
}
