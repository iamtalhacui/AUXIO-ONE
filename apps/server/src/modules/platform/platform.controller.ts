import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PlatformService } from './platform.service';

@Controller('platform')
@UseGuards(RolesGuard)
@Roles('SUPER_ADMIN')
export class PlatformController {
  constructor(
    private platformService: PlatformService,
    private prisma: PrismaService,
  ) {}

  @Get('health')
  async health() {
    let database: 'healthy' | 'unhealthy' = 'healthy';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'unhealthy';
    }

    return {
      status: database === 'healthy' ? 'healthy' : 'degraded',
      services: {
        api: 'healthy',
        database,
        email: process.env.GMAIL_USER ? 'configured' : 'log-only',
      },
      checkedAt: new Date().toISOString(),
    };
  }

  @Get('modules')
  listModules() {
    return this.platformService.listModules();
  }

  @Get('entitlements')
  listEntitlements() {
    return this.platformService.listEntitlements();
  }

  @Get('invites')
  listPendingInvites() {
    return this.platformService.listPendingInvites();
  }
}
