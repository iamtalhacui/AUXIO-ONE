import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ModuleAccessGuard, RequireModule } from '../../common/guards/module-access.guard';
import { CurrentOrgUser } from '../auth/current-org-user.decorator';
import type { OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import { CreateOpportunityDto, UpdateOpportunityDto } from './dto/opportunity.dto';
import { CustomersService } from './customers.service';

// CRM opportunity pipeline (CRM module, Manager only).
@Controller('organisation/crm/opportunities')
@UseGuards(OrgJwtGuard, ModuleAccessGuard)
@RequireModule('CRM')
export class CrmController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.customers.listOpportunities(user.organisationId, user.role);
  }

  @Get('pipeline')
  pipeline(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.customers.pipelineSummary(user.organisationId, user.role);
  }

  @Post()
  create(@CurrentOrgUser() user: OrgJwtPayload, @Body() dto: CreateOpportunityDto) {
    return this.customers.createOpportunity(
      user.organisationId,
      user.sub,
      user.role,
      dto,
    );
  }

  @Patch(':id')
  update(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityDto,
  ) {
    return this.customers.updateOpportunity(user.organisationId, user.role, id, dto);
  }

  // Creates a CUSTOMERS onboarding record; opportunity is kept and linked.
  @Post(':id/convert')
  convert(@CurrentOrgUser() user: OrgJwtPayload, @Param('id') id: string) {
    return this.customers.convertOpportunity(
      user.organisationId,
      user.sub,
      user.role,
      id,
    );
  }
}
