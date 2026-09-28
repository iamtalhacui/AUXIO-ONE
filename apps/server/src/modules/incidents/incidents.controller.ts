import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ModuleAccessGuard, RequireModule } from '../../common/guards/module-access.guard';
import { PlatformApprovedGuard } from '../../common/guards/platform-approved.guard';
import { VerifiedOnboardingGuard } from '../../common/guards/verified-onboarding.guard';
import { CurrentOrgUser } from '../auth/current-org-user.decorator';
import type { OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import {
  CreateIncidentActionDto,
  CreateIncidentDto,
  ListIncidentsQueryDto,
  UpdateIncidentActionDto,
  UpdateIncidentDto,
} from './dto/incident.dto';
import { IncidentsService } from './incidents.service';

type MulterUpload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
};

@Controller('organisation/incidents')
@UseGuards(
  OrgJwtGuard,
  PlatformApprovedGuard,
  VerifiedOnboardingGuard,
  ModuleAccessGuard,
)
@RequireModule('INCIDENTS')
export class IncidentsController {
  constructor(private readonly incidents: IncidentsService) {}

  @Post()
  create(@CurrentOrgUser() user: OrgJwtPayload, @Body() dto: CreateIncidentDto) {
    return this.incidents.createIncident(
      user.organisationId,
      user.sub,
      user.role,
      dto,
    );
  }

  @Get()
  list(@CurrentOrgUser() user: OrgJwtPayload, @Query() query: ListIncidentsQueryDto) {
    return this.incidents.listIncidents(
      user.organisationId,
      user.sub,
      user.role,
      query,
    );
  }

  @Get(':id')
  getById(@CurrentOrgUser() user: OrgJwtPayload, @Param('id') id: string) {
    return this.incidents.getIncident(
      user.organisationId,
      user.sub,
      user.role,
      id,
    );
  }

  @Patch(':id')
  update(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateIncidentDto,
  ) {
    return this.incidents.updateIncident(
      user.organisationId,
      user.sub,
      user.role,
      id,
      dto,
    );
  }

  @Post(':id/actions')
  createAction(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateIncidentActionDto,
  ) {
    return this.incidents.createAction(
      user.organisationId,
      user.sub,
      user.role,
      id,
      dto,
    );
  }

  @Patch(':id/actions/:actionId')
  updateAction(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Param('actionId') actionId: string,
    @Body() dto: UpdateIncidentActionDto,
  ) {
    return this.incidents.updateAction(
      user.organisationId,
      user.sub,
      user.role,
      id,
      actionId,
      dto,
    );
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  uploadAttachment(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @UploadedFile() file: MulterUpload | undefined,
  ) {
    return this.incidents.uploadAttachment(
      user.organisationId,
      user.sub,
      user.role,
      id,
      file,
    );
  }

  @Get(':id/attachments/:attachmentId')
  downloadAttachment(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.incidents.downloadAttachment(
      user.organisationId,
      user.sub,
      user.role,
      id,
      attachmentId,
      res,
    );
  }

  @Delete(':id/attachments/:attachmentId')
  deleteAttachment(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.incidents.deleteAttachment(
      user.organisationId,
      user.sub,
      user.role,
      id,
      attachmentId,
    );
  }
}
