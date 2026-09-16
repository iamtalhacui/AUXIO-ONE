import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Body,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { PlatformApprovedGuard } from '../../common/guards/platform-approved.guard';
import { CurrentOrgUser } from '../auth/current-org-user.decorator';
import type { OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import { SaveOnboardingDraftDto } from './dto/save-onboarding-draft.dto';
import { OnboardingService } from './onboarding.service';
import { OnboardingTemplatesService } from './onboarding-templates.service';

type MulterUpload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
};

@Controller('onboarding')
@UseGuards(OrgJwtGuard, PlatformApprovedGuard)
export class OnboardingController {
  constructor(
    private readonly onboarding: OnboardingService,
    private readonly templates: OnboardingTemplatesService,
  ) {}

  @Get('template')
  getMyTemplate(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.templates.getTemplateForRole(user.role);
  }

  @Get('me')
  getMine(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.onboarding.getMine(user.sub, user.organisationId, user.role);
  }

  @Put('me/draft')
  saveDraft(@CurrentOrgUser() user: OrgJwtPayload, @Body() dto: SaveOnboardingDraftDto) {
    return this.onboarding.saveDraft(user.sub, user.organisationId, user.role, dto);
  }

  @Post('me/submit')
  submit(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.onboarding.submit(user.sub, user.organisationId, user.role);
  }

  @Post('me/documents/:fieldKey')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  uploadDocument(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('fieldKey') fieldKey: string,
    @UploadedFile() file: MulterUpload | undefined,
  ) {
    return this.onboarding.uploadDocument(
      user.sub,
      user.organisationId,
      user.role,
      fieldKey,
      file,
    );
  }

  @Get('me/documents/:documentId')
  async downloadDocument(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('documentId') documentId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.onboarding.downloadDocument(
      user.sub,
      user.organisationId,
      user.role,
      documentId,
    );
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${result.fileName.replace(/"/g, '')}"`,
    );
    return result.file;
  }

  @Delete('me/documents/:documentId')
  deleteDocument(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('documentId') documentId: string,
  ) {
    return this.onboarding.deleteDocument(
      user.sub,
      user.organisationId,
      user.role,
      documentId,
    );
  }
}
