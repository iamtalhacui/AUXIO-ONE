import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganisationsModule } from '../organisations/organisations.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { PlatformModule } from '../platform/platform.module';
import { EmployeeOverviewController } from './employee-overview.controller';
import { EmployeeScheduleController } from './employee-schedule.controller';
import { OrgAdminScheduleController } from './org-admin-schedule.controller';
import { RosterOverviewController } from './roster-overview.controller';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [AuthModule, OrganisationsModule, PlatformModule, OnboardingModule],
  controllers: [
    ScheduleController,
    EmployeeScheduleController,
    OrgAdminScheduleController,
    RosterOverviewController,
    EmployeeOverviewController,
  ],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
