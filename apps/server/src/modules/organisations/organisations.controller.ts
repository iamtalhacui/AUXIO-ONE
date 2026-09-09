import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentSuperAdmin } from '../platform-auth/current-super-admin.decorator';
import type { PlatformJwtPayload } from '../platform-auth/current-super-admin.decorator';
import { PlatformJwtGuard } from '../platform-auth/platform-jwt.guard';
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
}
