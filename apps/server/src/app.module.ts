import './load-env';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { PlatformAuthModule } from './modules/platform-auth/platform-auth.module';
import { OrganisationsModule } from './modules/organisations/organisations.module';
import { AuthModule } from './modules/auth/auth.module';
import { TeamModule } from './modules/team/team.module';

import { MailModule } from './common/mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    PlatformAuthModule,
    OrganisationsModule,
    AuthModule,
    TeamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
