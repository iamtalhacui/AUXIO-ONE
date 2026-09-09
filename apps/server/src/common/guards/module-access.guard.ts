import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganisationsService } from '../../modules/organisations/organisations.service';

/**
 * Decorator — attach to a controller or handler to require a specific module.
 * Example:
 *   @UseGuards(OrgJwtGuard, ModuleAccessGuard)
 *   @RequireModule('SCHEDULE')
 */
export const MODULE_KEY = 'required_module';
export const RequireModule = (moduleCode: string) =>
  SetMetadata(MODULE_KEY, moduleCode);

/**
 * Guard — reads the module code from @RequireModule() metadata,
 * reads the user's organisationId from request.user, and calls
 * assertModuleAccess() to verify plan entitlement + enabled status.
 *
 * Must be used AFTER OrgJwtGuard so request.user.organisationId is set.
 * If the module is not in the plan or is disabled, the request is rejected
 * for every org user — role and permissions do not bypass this.
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

    if (!moduleCode) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { organisationId?: string } | undefined;

    if (!user?.organisationId) {
      throw new ForbiddenException('Organisation context is required');
    }

    await this.organisationsService.assertModuleAccess(
      user.organisationId,
      moduleCode,
    );

    return true;
  }
}
