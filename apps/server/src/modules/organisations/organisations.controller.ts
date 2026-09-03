import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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

  @Post()
  register(@Body() dto: RegisterOrganisationDto) {
    return this.organisationsService.register(dto);
  }
}
