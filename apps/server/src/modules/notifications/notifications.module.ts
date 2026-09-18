import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlatformAuthModule } from '../platform-auth/platform-auth.module';
import {
  OrgNotificationsController,
  PlatformNotificationsController,
} from './notifications.controller';
import { NotificationsService } from './notifications.service';

// Global so any other module can inject NotificationsService directly
// (same pattern as PrismaModule / MailModule) without adding an import.
@Global()
@Module({
  imports: [AuthModule, PlatformAuthModule],
  controllers: [OrgNotificationsController, PlatformNotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
