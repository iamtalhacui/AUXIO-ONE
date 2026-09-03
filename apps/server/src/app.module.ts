import './load-env';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { PlatformAuthModule } from './modules/platform-auth/platform-auth.module';
import { OrganisationsModule } from './modules/organisations/organisations.module';
import { AuthModule } from './modules/auth/auth.module';

import { MailModule } from './common/mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule, PlatformAuthModule, OrganisationsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
