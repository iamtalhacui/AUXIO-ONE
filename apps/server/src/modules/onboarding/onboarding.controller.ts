import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { SkipWorkforceGate } from '../../common/decorators/skip-workforce-gate.decorator';
import { FILE_STORAGE, type FileStorage } from '../../common/storage/file-storage.interface';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SaveOnboardingDto } from './dto/save-onboarding.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import {
  assertOnboardingDocType,
  onboardingUploadOptions,
} from './onboarding-upload.config';
import { OnboardingService } from './onboarding.service';

type AuthRequest = {
  user: { sub: string; role?: string; organisationId?: string | null };
};

@Controller('onboarding')
@SkipWorkforceGate()
@UseGuards(RolesGuard)
export class OnboardingController {
  constructor(
    private onboardingService: OnboardingService,
    @Inject(FILE_STORAGE) private fileStorage: FileStorage,
  ) {}

  @Get('me')
  @Roles('MANAGER', 'ROSTERING_EXPERT', 'EMPLOYEE')
  getMyProfile(@Req() req: AuthRequest) {
    return this.onboardingService.getMyProfile(req.user.sub, req.user.role);
  }

  @Put('me')
  @Roles('MANAGER', 'ROSTERING_EXPERT', 'EMPLOYEE')
  saveMyProfile(@Req() req: AuthRequest, @Body() dto: SaveOnboardingDto) {
    return this.onboardingService.saveMyProfile(req.user.sub, req.user.role, dto);
  }

  @Get('me/profile')
  @Roles('MANAGER', 'ROSTERING_EXPERT', 'EMPLOYEE')
  getMyBasicProfile(@Req() req: AuthRequest) {
    return this.onboardingService.getMyBasicProfile(req.user.sub, req.user.role);
  }

  @Patch('me/profile')
  @Roles('MANAGER', 'ROSTERING_EXPERT', 'EMPLOYEE')
  updateMyBasicProfile(@Req() req: AuthRequest, @Body() dto: UpdateMyProfileDto) {
    return this.onboardingService.updateMyBasicProfile(
      req.user.sub,
      req.user.role,
      dto,
    );
  }

  @Post('me/submit')
  @Roles('MANAGER', 'ROSTERING_EXPERT', 'EMPLOYEE')
  submitMyProfile(@Req() req: AuthRequest) {
    return this.onboardingService.submitMyProfile(req.user.sub, req.user.role);
  }

  @Post('me/documents/:docType')
  @Roles('MANAGER', 'ROSTERING_EXPERT', 'EMPLOYEE')
  @UseInterceptors(FileInterceptor('file', onboardingUploadOptions))
  uploadDocument(
    @Req() req: AuthRequest,
    @Param('docType') docType: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    assertOnboardingDocType(docType);
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.onboardingService.buildUploadedFileMeta(file);
  }

  @Get('documents/:storedName')
  @Roles('ORG_ADMIN', 'MANAGER', 'ROSTERING_EXPERT', 'EMPLOYEE')
  async getDocument(
    @Req() req: AuthRequest,
    @Param('storedName') storedName: string,
    @Res() res: Response,
  ) {
    await this.onboardingService.assertDocumentAccess(
      storedName,
      req.user.sub,
      req.user.role,
      req.user.organisationId,
    );

    if (!this.fileStorage.exists(storedName)) {
      res.status(404).send('File not found');
      return;
    }

    this.fileStorage.openReadStream(storedName).pipe(res);
  }
}
