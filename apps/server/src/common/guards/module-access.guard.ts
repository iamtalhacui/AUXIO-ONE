import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganisationsService } from '../../modules/organisations/organisations.service';

/**
 * Decorator — attach to a controller or handler to require a specific module.
 * Example: @RequireModule('SCHEDULE')
 */
export const MODULE_KEY = 'required_module';
export const RequireModule = (moduleCode: string) =>
  SetMetadata(MODULE_KEY, moduleCode);

/**
 * Guard — reads the module code from @RequireModule() metadata,
 * reads the user's organisationId from request.user, and calls
 * assertModuleAccess() to verify plan entitlement + enabled status.
 *
 * Must be used AFTER an auth guard that sets request.user with organisationId.
 */
@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly organisationsService: OrganisationsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const moduleCode = this.reflector.getAllAndOverride<string | undefined>(
      MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @RequireModule decorator → skip check
    if (!moduleCode) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { organisationId?: string } | undefined;

    if (!user?.organisationId) {
      // No org context → can't check modules. Another guard should have blocked this.
      return false;
    }

    // Throws ForbiddenException if not entitled or not enabled
    await this.organisationsService.assertModuleAccess(
      user.organisationId,
      moduleCode,
    );

    return true;
  }
}
