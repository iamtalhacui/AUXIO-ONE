import { Body, Controller, ForbiddenException, Get, Patch, UseGuards } from '@nestjs/common';
import { PlatformApprovedGuard } from '../../common/guards/platform-approved.guard';
import { VerifiedOnboardingGuard } from '../../common/guards/verified-onboarding.guard';
import { CurrentOrgUser } from '../auth/current-org-user.decorator';
import type { OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { PermissionsService } from './permissions.service';

@Controller('organisation/permissions')
@UseGuards(OrgJwtGuard, PlatformApprovedGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // Any org user: the permission codes their own role currently has.
  @Get('me')
  async me(@CurrentOrgUser() user: OrgJwtPayload) {
    const permissions = await this.permissionsService.getEffectivePermissions(
      user.organisationId,
      user.role,
    );
    return { role: user.role, permissions };
  }

  // Org Admin only: full matrix for the configurable roles.
  @Get()
  getMatrix(@CurrentOrgUser() user: OrgJwtPayload) {
    if (user.role !== 'ORG_ADMIN') {
      throw new ForbiddenException('Only organisation admins can view role permissions');
    }
    return this.permissionsService.getMatrix(user.organisationId);
  }

  // Org Admin only: enable/disable permissions for configurable roles.
  @Patch()
  @UseGuards(VerifiedOnboardingGuard)
  update(@CurrentOrgUser() user: OrgJwtPayload, @Body() dto: UpdateRolePermissionsDto) {
    return this.permissionsService.updateRolePermissions(
      user.organisationId,
      { userId: user.sub, role: user.role },
      dto.changes,
    );
  }
}
