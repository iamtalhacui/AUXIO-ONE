import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrganisationService } from './organisation.service';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { ToggleModuleDto } from './dto/toggle-module.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('organisations')
export class OrganisationController {
  constructor(private orgService: OrganisationService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  create(@Body() dto: CreateOrganisationDto, @Req() req: any) {
    return this.orgService.create(dto, req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orgService.findOne(id);
  }

  @Get(':id/modules')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ORG_ADMIN')
  listModules(@Param('id') id: string, @Req() req: any) {
    this.assertSameOrg(req, id);
    return this.orgService.listModuleEntitlements(id);
  }

  @Patch(':id/modules/:moduleCode')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ORG_ADMIN')
  toggleModule(
    @Param('id') id: string,
    @Param('moduleCode') moduleCode: string,
    @Body() dto: ToggleModuleDto,
    @Req() req: any,
  ) {
    this.assertSameOrg(req, id);
    return this.orgService.toggleModule(
      id,
      moduleCode,
      dto.enabled,
      req.user.sub,
    );
  }

  private assertSameOrg(req: any, orgId: string) {
    if (req.user.organisationId !== orgId) {
      throw new ForbiddenException('Cannot act outside your own organisation');
    }
  }
}
