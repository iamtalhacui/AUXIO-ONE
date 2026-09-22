import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformApprovedGuard } from '../../common/guards/platform-approved.guard';
import { VerifiedOnboardingGuard } from '../../common/guards/verified-onboarding.guard';
import { CurrentOrgUser } from '../auth/current-org-user.decorator';
import type { OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import { ScheduleService } from './schedule.service';

// Employee home — soft-gates SCHEDULE / SERVICE_DELIVERY inside the service.
@Controller('organisation/employee')
@UseGuards(OrgJwtGuard, PlatformApprovedGuard, VerifiedOnboardingGuard)
export class EmployeeOverviewController {
  constructor(private readonly schedule: ScheduleService) {}

  @Get('overview')
  getOverview(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.schedule.getEmployeeOverview(
      user.organisationId,
      user.sub,
      user.role,
    );
  }
}
