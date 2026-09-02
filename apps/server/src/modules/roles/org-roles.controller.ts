import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateOrgRolesDto } from './dto/update-org-roles.dto';
import { OrgRolesService } from './org-roles.service';

@Controller('organisations/:organisationId/roles')
@UseGuards(RolesGuard)
@Roles('ORG_ADMIN')
export class OrgRolesController {
  constructor(private orgRolesService: OrgRolesService) {}

  @Get()
  getRoles(@Param('organisationId') organisationId: string, @Req() req: any) {
    this.assertSameOrg(req, organisationId);
    return this.orgRolesService.getOrgRoles(organisationId);
  }

  @Put()
  updateRoles(
    @Param('organisationId') organisationId: string,
    @Body() dto: UpdateOrgRolesDto,
    @Req() req: any,
  ) {
    this.assertSameOrg(req, organisationId);
    return this.orgRolesService.updateOrgRoles(
      organisationId,
      dto,
      req.user.sub,
    );
  }

  @Post('reset')
  resetRoles(@Param('organisationId') organisationId: string, @Req() req: any) {
    this.assertSameOrg(req, organisationId);
    return this.orgRolesService.resetOrgRoles(organisationId, req.user.sub);
  }

  private assertSameOrg(req: any, orgId: string) {
    if (req.user.organisationId !== orgId) {
      throw new ForbiddenException('Cannot act outside your own organisation');
    }
  }
}
