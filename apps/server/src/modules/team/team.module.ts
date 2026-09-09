import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { OrganisationsModule } from '../organisations/organisations.module';
import { PlatformModule } from '../platform/platform.module';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';

@Module({
  imports: [AuthModule, OrganisationsModule, PlatformModule, OnboardingModule],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
