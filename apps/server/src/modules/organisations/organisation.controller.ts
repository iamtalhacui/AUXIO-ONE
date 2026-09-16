import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { PlatformApprovedGuard } from '../../common/guards/platform-approved.guard';
import { VerifiedOnboardingGuard } from '../../common/guards/verified-onboarding.guard';
import { CurrentOrgUser } from '../auth/current-org-user.decorator';
import type { OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { OrganisationsService } from './organisations.service';

type MulterUpload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
};

// Org-scoped profile + branding (distinct from /organisation/modules).
@Controller('organisation')
@UseGuards(OrgJwtGuard, PlatformApprovedGuard)
export class OrganisationController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Get()
  get(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.organisationsService.getOrganisation(user.organisationId);
  }

  @Patch()
  @UseGuards(VerifiedOnboardingGuard)
  update(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Body() dto: UpdateOrganisationDto,
  ) {
    return this.organisationsService.updateOrganisation(
      user.organisationId,
      user.role,
      dto,
    );
  }

  @Post('logo')
  @UseGuards(VerifiedOnboardingGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  uploadLogo(
    @CurrentOrgUser() user: OrgJwtPayload,
    @UploadedFile() file: MulterUpload | undefined,
  ) {
    return this.organisationsService.uploadLogo(
      user.organisationId,
      user.role,
      file,
    );
  }

  @Get('logo')
  async downloadLogo(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.organisationsService.getLogo(user.organisationId);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${result.fileName.replace(/"/g, '')}"`,
    );
    res.setHeader('Cache-Control', 'private, max-age=300');
    return result.file;
  }

  @Delete('logo')
  @UseGuards(VerifiedOnboardingGuard)
  deleteLogo(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.organisationsService.deleteLogo(
      user.organisationId,
      user.role,
    );
  }
}
