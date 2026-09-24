import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ModuleAccessGuard, RequireModule } from '../../common/guards/module-access.guard';
import { PermissionGuard, RequirePermission } from '../../common/guards/permission.guard';
import { PlatformApprovedGuard } from '../../common/guards/platform-approved.guard';
import { VerifiedOnboardingGuard } from '../../common/guards/verified-onboarding.guard';
import { CurrentOrgUser } from '../auth/current-org-user.decorator';
import type { OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import {
  CreateShiftDto,
  PreviewRecurrenceDto,
  PublishOfferDto,
  UpdateShiftDto,
} from './dto/schedule.dto';
import { ScheduleService } from './schedule.service';

/**
 * Rostering Expert schedule APIs (SCHEDULE module).
 * Create drafts, match, publish/offer — no Manager create in Phase A.
 */
@Controller('organisation/schedule')
@UseGuards(
  OrgJwtGuard,
  PlatformApprovedGuard,
  VerifiedOnboardingGuard,
  ModuleAccessGuard,
  PermissionGuard,
)
@RequireModule('SCHEDULE')
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @RequirePermission('view_schedules')
  @Get('participants')
  listParticipants(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.schedule.listParticipants(user.organisationId, user.role);
  }

  @RequirePermission('view_schedules')
  @Get('workers')
  listWorkers(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.schedule.listWorkers(user.organisationId, user.role);
  }

  @RequirePermission('view_schedules')
  @Get('shifts')
  listShifts(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.schedule.listShifts(user.organisationId, user.role, from, to);
  }

  @RequirePermission('view_schedules')
  @Get('shifts/:id')
  getShift(@CurrentOrgUser() user: OrgJwtPayload, @Param('id') id: string) {
    return this.schedule.getShift(user.organisationId, user.role, id);
  }

  @RequirePermission('create_edit_schedules')
  @Post('shifts/preview-recurrence')
  previewRecurrence(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Body() dto: PreviewRecurrenceDto,
  ) {
    return this.schedule.previewRecurrence(user.organisationId, user.role, dto);
  }

  @RequirePermission('create_edit_schedules')
  @Post('shifts')
  create(@CurrentOrgUser() user: OrgJwtPayload, @Body() dto: CreateShiftDto) {
    return this.schedule.createShifts(
      user.organisationId,
      user.sub,
      user.role,
      dto,
    );
  }

  @RequirePermission('create_edit_schedules')
  @Patch('shifts/:id')
  update(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
  ) {
    return this.schedule.updateShift(user.organisationId, user.role, id, dto);
  }

  @RequirePermission('create_edit_schedules')
  @Post('shifts/:id/cancel')
  cancel(@CurrentOrgUser() user: OrgJwtPayload, @Param('id') id: string) {
    return this.schedule.cancelShift(user.organisationId, user.role, id);
  }

  @RequirePermission('assign_shifts')
  @Post('shifts/:id/publish')
  publishUnfilled(@CurrentOrgUser() user: OrgJwtPayload, @Param('id') id: string) {
    return this.schedule.publishUnfilled(user.organisationId, user.role, id);
  }

  @RequirePermission('assign_shifts')
  @Post('shifts/:id/publish-offer')
  publishAndOffer(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Body() dto: PublishOfferDto,
  ) {
    return this.schedule.publishAndOffer(
      user.organisationId,
      user.role,
      id,
      dto.workerId,
    );
  }

  @RequirePermission('assign_shifts')
  @Post('shifts/:id/withdraw-offer')
  withdrawOffer(@CurrentOrgUser() user: OrgJwtPayload, @Param('id') id: string) {
    return this.schedule.withdrawOffer(user.organisationId, user.role, id);
  }

  @RequirePermission('assign_shifts')
  @Get('shifts/:id/candidates')
  listCandidates(@CurrentOrgUser() user: OrgJwtPayload, @Param('id') id: string) {
    return this.schedule.listCandidates(user.organisationId, user.role, id);
  }
}
