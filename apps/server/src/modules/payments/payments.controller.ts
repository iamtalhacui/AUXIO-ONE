import {
  Body,
  Controller,
  Get,
  Param,
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
import { CurrentOrgUser } from '../auth/current-org-user.decorator';
import type { OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import { SubmitPaymentDto } from './dto/submit-payment.dto';
import { PaymentsService } from './payments.service';

type MulterUpload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
};

@Controller('organisation/payments')
@UseGuards(OrgJwtGuard, PlatformApprovedGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('summary')
  getSummary(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.payments.getBillingSummary(user.organisationId, user.role);
  }

  @Get()
  list(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.payments.listPayments(user.organisationId, user.role);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }),
  )
  submit(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Body() dto: SubmitPaymentDto,
    @UploadedFile() file: MulterUpload | undefined,
  ) {
    return this.payments.submitPayment(
      user.organisationId,
      user.sub,
      user.role,
      dto,
      file,
    );
  }

  @Get(':id/proof')
  async downloadProof(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.payments.getProof(
      user.organisationId,
      user.role,
      id,
    );
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${result.fileName.replace(/"/g, '')}"`,
    );
    res.setHeader('Cache-Control', 'private, max-age=60');
    return result.file;
  }
}
