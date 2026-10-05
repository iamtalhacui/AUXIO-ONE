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
import { CurrentSuperAdmin } from '../platform-auth/current-super-admin.decorator';
import type { PlatformJwtPayload } from '../platform-auth/current-super-admin.decorator';
import { PlatformJwtGuard } from '../platform-auth/platform-jwt.guard';
import { RejectPaymentDto } from './dto/reject-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('platform/payments')
@UseGuards(PlatformJwtGuard)
export class PlatformPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('overview')
  getOverview() {
    return this.payments.getPlatformPaymentsOverview();
  }

  @Get()
  list(@Query('status') status?: string) {
    return this.payments.listPlatformPayments(status);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.payments.getPlatformPayment(id);
  }

  @Get(':id/proof')
  async downloadProof(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.payments.getPlatformProof(id);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${result.fileName.replace(/"/g, '')}"`,
    );
    res.setHeader('Cache-Control', 'private, max-age=60');
    return result.file;
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @CurrentSuperAdmin() admin: PlatformJwtPayload,
  ) {
    return this.payments.approvePayment(id, admin.email);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectPaymentDto,
    @CurrentSuperAdmin() admin: PlatformJwtPayload,
  ) {
    return this.payments.rejectPayment(id, dto.reason, admin.email);
  }
}
