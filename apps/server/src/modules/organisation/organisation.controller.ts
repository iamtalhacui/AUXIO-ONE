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
import { SuperAdminOrganisationService } from './super-admin-organisation.service';
import { OrgAdminOrganisationService } from './org-admin-organisation.service';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { UpdateModuleCeilingDto } from './dto/update-module-ceiling.dto';
import { UpdateOrgAdminProfileDto } from './dto/update-org-admin-profile.dto';
import { ToggleModuleDto } from './dto/toggle-module.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('organisations')
export class OrganisationController {
  constructor(
    private superAdminOrgService: SuperAdminOrganisationService,
    private orgAdminOrgService: OrgAdminOrganisationService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  create(@Body() dto: CreateOrganisationDto, @Req() req: any) {
    return this.superAdminOrgService.create(dto, req.user.sub);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  findAll() {
    return this.superAdminOrgService.findAll();
  }

  @Get('me/profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ORG_ADMIN')
  getMyProfile(@Req() req: any) {
    this.assertOrgAdminHasOrg(req);
    return this.orgAdminOrgService.getOrgAdminProfile(req.user.organisationId);
  }

  @Patch('me/profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ORG_ADMIN')
  updateMyProfile(@Req() req: any, @Body() dto: UpdateOrgAdminProfileDto) {
    this.assertOrgAdminHasOrg(req);
    return this.orgAdminOrgService.updateOrgAdminProfile(
      req.user.organisationId,
      dto,
      req.user.sub,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  findOne(@Param('id') id: string) {
    return this.superAdminOrgService.findOneDetail(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganisationDto,
    @Req() req: any,
  ) {
    return this.superAdminOrgService.update(id, dto, req.user.sub);
  }

  @Patch(':id/module-ceiling')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  updateModuleCeiling(
    @Param('id') id: string,
    @Body() dto: UpdateModuleCeilingDto,
    @Req() req: any,
  ) {
    return this.superAdminOrgService.updateModuleCeiling(
      id,
      dto.moduleCeilingCodes,
      req.user.sub,
    );
  }

  @Get(':id/modules')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ORG_ADMIN')
  listModules(@Param('id') id: string, @Req() req: any) {
    this.assertSameOrg(req, id);
    return this.orgAdminOrgService.listModuleEntitlements(id);
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
    return this.orgAdminOrgService.toggleModule(
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

  private assertOrgAdminHasOrg(req: any) {
    if (!req.user.organisationId) {
      throw new ForbiddenException('No organisation linked to your account');
    }
  }
}
