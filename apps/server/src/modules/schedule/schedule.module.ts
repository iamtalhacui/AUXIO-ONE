import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganisationsModule } from '../organisations/organisations.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { PlatformModule } from '../platform/platform.module';
import { EmployeeScheduleController } from './employee-schedule.controller';
import { OrgAdminScheduleController } from './org-admin-schedule.controller';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [AuthModule, OrganisationsModule, PlatformModule, OnboardingModule],
  controllers: [
    ScheduleController,
    EmployeeScheduleController,
    OrgAdminScheduleController,
  ],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
