import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { VerifiedOnboardingGuard } from '../../common/guards/verified-onboarding.guard';
import { CurrentOrgUser } from '../auth/current-org-user.decorator';
import type { OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import { ReviewOnboardingDto } from './dto/review-onboarding.dto';
import { OnboardingService } from './onboarding.service';

@Controller('organisation/onboarding')
@UseGuards(OrgJwtGuard, VerifiedOnboardingGuard)
export class OrganisationOnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  // List onboarding submissions in this organisation (Org Admin).
  @Get()
  list(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Query('status') status?: string,
  ) {
    return this.onboarding.listForAdmin(user.organisationId, user.role, status);
  }

  // Full submission detail for review (Org Admin).
  @Get(':userId')
  getByUser(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('userId') userId: string,
  ) {
    return this.onboarding.getForAdmin(user.organisationId, user.role, userId);
  }

  // Download a member document during review (Org Admin).
  @Get(':userId/documents/:documentId')
  async downloadDocument(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('userId') userId: string,
    @Param('documentId') documentId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.onboarding.downloadDocumentForAdmin(
      user.organisationId,
      user.role,
      userId,
      documentId,
    );
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${result.fileName.replace(/"/g, '')}"`,
    );
    return result.file;
  }

  // Approve (VERIFIED) or reject (CHANGES_REQUIRED + note).
  @Post(':userId/review')
  review(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('userId') userId: string,
    @Body() dto: ReviewOnboardingDto,
  ) {
    return this.onboarding.review(
      user.organisationId,
      user.role,
      user.sub,
      userId,
      dto.decision,
      dto.note,
    );
  }
}
