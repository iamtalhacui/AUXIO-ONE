import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { PlatformApprovedGuard } from '../../common/guards/platform-approved.guard';
import { VerifiedOnboardingGuard } from '../../common/guards/verified-onboarding.guard';
import { CurrentOrgUser } from '../auth/current-org-user.decorator';
import type { OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { PermissionsService } from './permissions.service';

@Controller('organisation/role-permissions')
@UseGuards(OrgJwtGuard, PlatformApprovedGuard, VerifiedOnboardingGuard)
export class RolePermissionsController {
  constructor(private readonly permissions: PermissionsService) {}

  @Get()
  getMatrix(@CurrentOrgUser() user: OrgJwtPayload) {
    if (user.role !== 'ORG_ADMIN') {
      return this.permissions.resolve(user.organisationId, user.role);
    }
    return this.permissions.getMatrix(user.organisationId);
  }

  @Put()
  updateMatrix(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.permissions.updateMatrix(user.organisationId, user.role, dto);
  }
}
