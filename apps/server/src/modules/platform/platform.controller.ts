import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentSuperAdmin } from '../platform-auth/current-super-admin.decorator';
import type { PlatformJwtPayload } from '../platform-auth/current-super-admin.decorator';
import { PlatformJwtGuard } from '../platform-auth/platform-jwt.guard';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { PlatformService } from './platform.service';

// Super Admin-only platform reads: settings, audit, modules, entitlements, invites.
@Controller('platform')
@UseGuards(PlatformJwtGuard)
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get('overview')
  getOverview() {
    return this.platform.getOverview();
  }

  @Get('settings')
  getSettings() {
    return this.platform.getSettings();
  }

  // Schedule, emergency-on, or clear maintenance (single engine).
  @Patch('settings')
  setSettings(
    @CurrentSuperAdmin() admin: PlatformJwtPayload,
    @Body() dto: UpdatePlatformSettingsDto,
  ) {
    return this.platform.updateMaintenance(dto, admin.email);
  }

  @Get('audit')
  listAudit() {
    return this.platform.listAudit();
  }

  @Get('modules')
  listModules() {
    return this.platform.listModules();
  }

  @Get('entitlements')
  listEntitlements() {
    return this.platform.listEntitlements();
  }

  @Get('invites')
  listInvites() {
    return this.platform.listInvites();
  }
}
