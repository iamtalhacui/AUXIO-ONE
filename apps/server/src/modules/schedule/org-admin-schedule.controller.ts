import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ModuleAccessGuard, RequireModule } from '../../common/guards/module-access.guard';
import { PlatformApprovedGuard } from '../../common/guards/platform-approved.guard';
import { VerifiedOnboardingGuard } from '../../common/guards/verified-onboarding.guard';
import { CurrentOrgUser } from '../auth/current-org-user.decorator';
import type { OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import { ReviewShiftDto, SaveServiceLineTasksDto } from './dto/schedule.dto';
import { ScheduleService } from './schedule.service';

/**
 * Org Admin: variance approval queue + service-line task catalogues.
 */
@Controller('organisation/schedule/admin')
@UseGuards(
  OrgJwtGuard,
  PlatformApprovedGuard,
  VerifiedOnboardingGuard,
  ModuleAccessGuard,
)
@RequireModule('SCHEDULE')
export class OrgAdminScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Get('pending-approvals')
  listPending(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.schedule.listPendingApprovals(user.organisationId, user.role);
  }

  @Post('shifts/:id/approve')
  approve(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Body() dto: ReviewShiftDto,
  ) {
    return this.schedule.approveShift(
      user.organisationId,
      user.sub,
      user.role,
      id,
      dto.reviewNote,
    );
  }

  @Post('shifts/:id/reject')
  reject(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Body() dto: ReviewShiftDto,
  ) {
    return this.schedule.rejectShift(
      user.organisationId,
      user.sub,
      user.role,
      id,
      dto.reviewNote,
    );
  }

  @Get('service-line-tasks')
  listTaskCatalogues(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.schedule.listServiceLineTaskCatalogues(
      user.organisationId,
      user.role,
    );
  }

  @Put('service-line-tasks')
  saveTaskCatalogue(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Body() dto: SaveServiceLineTasksDto,
  ) {
    return this.schedule.saveServiceLineTasks(
      user.organisationId,
      user.role,
      dto,
    );
  }
}
