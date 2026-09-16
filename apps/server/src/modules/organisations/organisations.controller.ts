import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentSuperAdmin } from '../platform-auth/current-super-admin.decorator';
import type { PlatformJwtPayload } from '../platform-auth/current-super-admin.decorator';
import { PlatformJwtGuard } from '../platform-auth/platform-jwt.guard';
import { ChangeOrgAdminEmailDto } from './dto/change-org-admin-email.dto';
import { OrganisationsService } from './organisations.service';
import { RegisterOrganisationDto } from './dto/register-organisation.dto';

@Controller('platform/organisations')
@UseGuards(PlatformJwtGuard)
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Get()
  list() {
    return this.organisationsService.list();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.organisationsService.getById(id);
  }

  // Super Admin email is stored on the audit log for this registration.
  @Post()
  register(
    @CurrentSuperAdmin() admin: PlatformJwtPayload,
    @Body() dto: RegisterOrganisationDto,
  ) {
    return this.organisationsService.register(dto, admin.email);
  }

  @Post(':id/approve-admin')
  approveAdmin(
    @CurrentSuperAdmin() admin: PlatformJwtPayload,
    @Param('id') id: string,
  ) {
    return this.organisationsService.approveOrgAdmin(id, admin.email);
  }

  @Post(':id/reject-admin')
  rejectAdmin(
    @CurrentSuperAdmin() admin: PlatformJwtPayload,
    @Param('id') id: string,
  ) {
    return this.organisationsService.rejectOrgAdmin(id, admin.email);
  }

  @Patch(':id/admin-email')
  changeAdminEmail(
    @CurrentSuperAdmin() admin: PlatformJwtPayload,
    @Param('id') id: string,
    @Body() dto: ChangeOrgAdminEmailDto,
  ) {
    return this.organisationsService.changeOrgAdminEmail(id, admin.email, dto);
  }
}
