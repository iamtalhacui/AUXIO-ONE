import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfrastructureModule } from './common/infrastructure/infrastructure.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { OrganisationModule } from './modules/organisation/organisation.module';
import { AuthModule } from './modules/auth/auth.module';
import { TeamModule } from './modules/team/team.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { AuditModule } from './modules/audit/audit.module';
import { PlatformModule } from './modules/platform/platform.module';

@Module({
  imports: [
    PrismaModule,
    InfrastructureModule,
    OrganisationModule,
    AuthModule,
    TeamModule,
    OnboardingModule,
    AuditModule,
    PlatformModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
