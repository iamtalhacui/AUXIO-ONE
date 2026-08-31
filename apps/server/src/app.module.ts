import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { OrganisationModule } from './modules/organisation/organisation.module';
import { AuthModule } from './modules/auth/auth.module';
import { TeamModule } from './modules/team/team.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';

@Module({
  imports: [PrismaModule, OrganisationModule, AuthModule, TeamModule, OnboardingModule],
  // controllers: [AppController],
  // providers: [AppService],
})
export class AppModule {}
