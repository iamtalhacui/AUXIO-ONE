import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformApprovedGuard } from '../../common/guards/platform-approved.guard';
import { CurrentOrgUser } from '../auth/current-org-user.decorator';
import type { OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import { CustomersService } from './customers.service';

// Manager home dashboard — soft-gates CUSTOMERS / CRM data inside the service.
@Controller('organisation/manager')
@UseGuards(OrgJwtGuard, PlatformApprovedGuard)
export class ManagerOverviewController {
  constructor(private readonly customers: CustomersService) {}

  @Get('overview')
  getOverview(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.customers.getManagerOverview(user.organisationId, user.role);
  }
}
