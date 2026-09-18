import { Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentOrgUser, type OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import { PlatformApprovedGuard } from '../../common/guards/platform-approved.guard';
import {
  CurrentSuperAdmin,
  type PlatformJwtPayload,
} from '../platform-auth/current-super-admin.decorator';
import { PlatformJwtGuard } from '../platform-auth/platform-jwt.guard';
import { NotificationsService } from './notifications.service';

/** Organisation users (any role) — their own notification feed. */
@Controller('organisation/notifications')
@UseGuards(OrgJwtGuard, PlatformApprovedGuard)
export class OrgNotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.notifications.listForUser(user.sub);
  }

  @Patch(':id/read')
  markRead(@CurrentOrgUser() user: OrgJwtPayload, @Param('id') id: string) {
    return this.notifications.markRead(id, { userId: user.sub });
  }

  @Post('read-all')
  markAllRead(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.notifications.markAllRead({ userId: user.sub });
  }
}

/** Super Admins — platform-wide notification feed. */
@Controller('platform/notifications')
@UseGuards(PlatformJwtGuard)
export class PlatformNotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentSuperAdmin() admin: PlatformJwtPayload) {
    return this.notifications.listForSuperAdmin(admin.sub);
  }

  @Patch(':id/read')
  markRead(@CurrentSuperAdmin() admin: PlatformJwtPayload, @Param('id') id: string) {
    return this.notifications.markRead(id, { superAdminId: admin.sub });
  }

  @Post('read-all')
  markAllRead(@CurrentSuperAdmin() admin: PlatformJwtPayload) {
    return this.notifications.markAllRead({ superAdminId: admin.sub });
  }
}