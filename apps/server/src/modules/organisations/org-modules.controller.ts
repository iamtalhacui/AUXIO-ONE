import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentOrgUser } from '../auth/current-org-user.decorator';
import type { OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import { SetModuleEnabledDto } from './dto/set-module-enabled.dto';
import { OrganisationsService } from './organisations.service';

// Org Admin (and other org users) read/toggle modules for their own tenant.
@Controller('organisation/modules')
@UseGuards(OrgJwtGuard)
export class OrgModulesController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Get()
  list(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.organisationsService.listOrgModules(user.organisationId);
  }

  // Enable or disable one plan-included module for this organisation.
  @Patch(':code')
  setEnabled(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('code') code: string,
    @Body() dto: SetModuleEnabledDto,
  ) {
    return this.organisationsService.setModuleEnabled(
      user.organisationId,
      user.role,
      code,
      dto.enabled,
    );
  }
}
