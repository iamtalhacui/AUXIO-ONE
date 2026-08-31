import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { RolesModule } from '../roles/roles.module';
import { OrgTeamController } from './org-team.controller';
import { OrgTeamService } from './org-team.service';
import { TeamCredentialEmailService } from './team-credential-email.service';

@Module({
  imports: [AuthModule, RolesModule, OnboardingModule],
  controllers: [OrgTeamController],
  providers: [OrgTeamService, TeamCredentialEmailService],
})
export class TeamModule {}
