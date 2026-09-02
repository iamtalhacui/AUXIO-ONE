import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuditService } from './audit.service';

@Controller()
@UseGuards(RolesGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('organisations/me/audit')
  @Roles('ORG_ADMIN')
  listOrgAudit(@Req() req: { user: { organisationId?: string | null } }) {
    return this.auditService.listForOrganisation(req.user.organisationId!);
  }

  @Get('platform/audit')
  @Roles('SUPER_ADMIN')
  listPlatformAudit() {
    return this.auditService.listPlatformActions();
  }
}
