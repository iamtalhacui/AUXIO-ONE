import { Body, Controller, Get, Param, Put, Post, UseGuards } from '@nestjs/common';
import { ModuleAccessGuard, RequireModule } from '../../common/guards/module-access.guard';
import { PlatformApprovedGuard } from '../../common/guards/platform-approved.guard';
import { VerifiedOnboardingGuard } from '../../common/guards/verified-onboarding.guard';
import { CurrentOrgUser } from '../auth/current-org-user.decorator';
import type { OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import {
  FinishShiftDto,
  SaveAvailabilityDto,
  SaveProgressNoteDto,
} from './dto/schedule.dto';
import { ScheduleService } from './schedule.service';

/**
 * Employee schedule + shift execution APIs.
 *
 * Rostering endpoints (list, accept/decline, availability, care view) require
 * SCHEDULE. Execution endpoints (start, tasks, notes, finish) require
 * SERVICE_DELIVERY and override the class-level module below.
 */
@Controller('organisation/schedule/my')
@UseGuards(
  OrgJwtGuard,
  PlatformApprovedGuard,
  VerifiedOnboardingGuard,
  ModuleAccessGuard,
)
@RequireModule('SCHEDULE')
export class EmployeeScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Get('shifts')
  listMyShifts(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.schedule.listMyShifts(user.organisationId, user.sub, user.role);
  }

  @Get('shifts/:id')
  getMyShift(@CurrentOrgUser() user: OrgJwtPayload, @Param('id') id: string) {
    return this.schedule.getMyShift(user.organisationId, user.sub, user.role, id);
  }

  @Post('shifts/:id/accept')
  accept(@CurrentOrgUser() user: OrgJwtPayload, @Param('id') id: string) {
    return this.schedule.acceptOffer(user.organisationId, user.sub, user.role, id);
  }

  @Post('shifts/:id/decline')
  decline(@CurrentOrgUser() user: OrgJwtPayload, @Param('id') id: string) {
    return this.schedule.declineOffer(user.organisationId, user.sub, user.role, id);
  }

  /** Phase B — record server start time and enable tasks/notes. */
  @Post('shifts/:id/start')
  @RequireModule('SERVICE_DELIVERY')
  start(@CurrentOrgUser() user: OrgJwtPayload, @Param('id') id: string) {
    return this.schedule.startMyShift(user.organisationId, user.sub, user.role, id);
  }

  @Post('shifts/:id/tasks/:taskId/complete')
  @RequireModule('SERVICE_DELIVERY')
  completeTask(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
  ) {
    return this.schedule.completeMyTask(
      user.organisationId,
      user.sub,
      user.role,
      id,
      taskId,
    );
  }

  @Put('shifts/:id/progress-note')
  @RequireModule('SERVICE_DELIVERY')
  saveNote(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Body() dto: SaveProgressNoteDto,
  ) {
    return this.schedule.saveMyProgressNote(
      user.organisationId,
      user.sub,
      user.role,
      id,
      dto,
    );
  }

  @Post('shifts/:id/finish')
  @RequireModule('SERVICE_DELIVERY')
  finish(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Body() dto: FinishShiftDto,
  ) {
    return this.schedule.finishMyShift(
      user.organisationId,
      user.sub,
      user.role,
      id,
      dto.finishReason,
    );
  }

  @Get('participants/:customerId')
  careView(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('customerId') customerId: string,
  ) {
    return this.schedule.getMyParticipantCareView(
      user.organisationId,
      user.sub,
      user.role,
      customerId,
    );
  }

  @Get('availability')
  getAvailability(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.schedule.getMyAvailability(
      user.organisationId,
      user.sub,
      user.role,
    );
  }

  @Put('availability')
  saveAvailability(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Body() dto: SaveAvailabilityDto,
  ) {
    return this.schedule.saveMyAvailability(
      user.organisationId,
      user.sub,
      user.role,
      dto,
    );
  }
}
