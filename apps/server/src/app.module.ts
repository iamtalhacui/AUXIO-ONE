import { Module } from '@nestjs/common';
import { InfrastructureModule } from './common/infrastructure/infrastructure.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { OrganisationModule } from './modules/organisation/organisation.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { TeamModule } from './modules/team/team.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { AuditModule } from './modules/audit/audit.module';
import { PlatformModule } from './modules/platform/platform.module';

@Module({
  imports: [
    PrismaModule,
    InfrastructureModule,
    AuthModule,
    RolesModule,
    OrganisationModule,
    TeamModule,
    OnboardingModule,
    AuditModule,
    PlatformModule,
  ],
})
export class AppModule {}
