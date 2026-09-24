import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { ModuleAccessGuard, RequireModule } from '../../common/guards/module-access.guard';
import { PermissionGuard, RequirePermission } from '../../common/guards/permission.guard';
import { PlatformApprovedGuard } from '../../common/guards/platform-approved.guard';
import { CurrentOrgUser } from '../auth/current-org-user.decorator';
import type { OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { CustomersService } from './customers.service';

type MulterUpload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
};

// Customer master data + document onboarding (CUSTOMERS module, Manager only).
@Controller('organisation/customers')
@UseGuards(OrgJwtGuard, PlatformApprovedGuard, ModuleAccessGuard, PermissionGuard)
@RequireModule('CUSTOMERS')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @RequirePermission('view_all_participants')
  @Get()
  list(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.customers.listCustomers(user.organisationId, user.role);
  }

  @RequirePermission('create_participants')
  @Post()
  create(@CurrentOrgUser() user: OrgJwtPayload, @Body() dto: CreateCustomerDto) {
    return this.customers.createCustomer(user.organisationId, user.sub, user.role, dto);
  }

  @RequirePermission('view_all_participants')
  @Get(':id')
  getById(@CurrentOrgUser() user: OrgJwtPayload, @Param('id') id: string) {
    return this.customers.getCustomer(user.organisationId, user.role, id);
  }

  @RequirePermission('edit_participant_records')
  @Patch(':id')
  update(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customers.updateCustomer(user.organisationId, user.role, id, dto);
  }

  @RequirePermission('edit_participant_records')
  @Post(':id/activate')
  activate(@CurrentOrgUser() user: OrgJwtPayload, @Param('id') id: string) {
    return this.customers.activateCustomer(user.organisationId, user.role, id);
  }

  @RequirePermission('edit_participant_records')
  @Post(':id/documents/mandatory/:fieldKey')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  uploadMandatory(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Param('fieldKey') fieldKey: string,
    @UploadedFile() file: MulterUpload | undefined,
  ) {
    return this.customers.uploadMandatoryDocument(
      user.organisationId,
      user.sub,
      user.role,
      id,
      fieldKey,
      file,
    );
  }

  @RequirePermission('edit_participant_records')
  @Post(':id/documents/optional')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  uploadOptional(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Body('label') label: string,
    @UploadedFile() file: MulterUpload | undefined,
  ) {
    return this.customers.uploadOptionalDocument(
      user.organisationId,
      user.sub,
      user.role,
      id,
      label ?? '',
      file,
    );
  }

  @RequirePermission('view_all_participants')
  @Get(':id/documents/:documentId')
  async download(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.customers.downloadDocument(
      user.organisationId,
      user.role,
      id,
      documentId,
    );
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${result.fileName.replace(/"/g, '')}"`,
    );
    return result.file;
  }

  @RequirePermission('edit_participant_records')
  @Delete(':id/documents/:documentId')
  deleteDoc(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    return this.customers.deleteDocument(
      user.organisationId,
      user.role,
      id,
      documentId,
    );
  }
}
