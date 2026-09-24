import './load-env';
import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { PlatformAuthModule } from './modules/platform-auth/platform-auth.module';
import { PlatformModule } from './modules/platform/platform.module';
import { OrganisationsModule } from './modules/organisations/organisations.module';
import { AuthModule } from './modules/auth/auth.module';
import { TeamModule } from './modules/team/team.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DemosModule } from './modules/demos/demos.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { MailModule } from './common/mail/mail.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    PermissionsModule,
    MailModule,
    NotificationsModule,
    PlatformAuthModule,
    PlatformModule,
    OrganisationsModule,
    AuthModule,
    TeamModule,
    OnboardingModule,
    CustomersModule,
    DemosModule,
    ScheduleModule,
  ],
})
export class AppModule {}
