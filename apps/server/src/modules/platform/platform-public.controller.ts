import { Controller, Get } from '@nestjs/common';
import { PlatformService } from './platform.service';

/** Unauthenticated maintenance status for login pages and org banners. */
@Controller('platform/public')
export class PlatformPublicController {
  constructor(private readonly platform: PlatformService) {}

  @Get('maintenance')
  getMaintenanceStatus() {
    return this.platform.getMaintenanceStatus();
  }
}
