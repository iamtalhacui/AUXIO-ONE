import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../../modules/permissions/permissions.service';

/**
 * Decorator — attach to a controller or handler to require a role permission.
 * Example:
 *   @UseGuards(OrgJwtGuard, ModuleAccessGuard, PermissionGuard)
 *   @RequirePermission('invite_team_members')
 *
 * A handler-level @RequirePermission overrides a controller-level one.
 */
export const PERMISSION_KEY = 'required_permission';
export const RequirePermission = (permissionCode: string) =>
  SetMetadata(PERMISSION_KEY, permissionCode);

/**
 * Guard — reads the permission code from @RequirePermission() metadata and
 * checks it against the caller's role within their organisation.
 *
 * Must be used AFTER OrgJwtGuard so request.user is set, and AFTER
 * ModuleAccessGuard so an organisation's module switch is checked first.
 * Routes without @RequirePermission are not affected.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissionCode = this.reflector.getAllAndOverride<string | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permissionCode) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as
      | { organisationId?: string; role?: string }
      | undefined;

    if (!user?.organisationId || !user.role) {
      throw new ForbiddenException('Organisation context is required');
    }

    const allowed = await this.permissions.isAllowed(
      user.organisationId,
      user.role,
      permissionCode,
    );

    if (!allowed) {
      throw new ForbiddenException(
        'Your role does not have permission to perform this action',
      );
    }

    return true;
  }
}
