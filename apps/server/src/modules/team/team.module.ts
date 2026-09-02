import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { RolesModule } from '../roles/roles.module';
import { OrgTeamController } from './org-team.controller';
import { OrgTeamService } from './org-team.service';

@Module({
  imports: [AuthModule, RolesModule, OnboardingModule],
  controllers: [OrgTeamController],
  providers: [OrgTeamService],
})
export class TeamModule {}
