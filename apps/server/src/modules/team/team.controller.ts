import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { VerifiedOnboardingGuard } from '../../common/guards/verified-onboarding.guard';
import { ModuleAccessGuard, RequireModule } from '../../common/guards/module-access.guard';
import { PlatformApprovedGuard } from '../../common/guards/platform-approved.guard';
import { CurrentOrgUser } from '../auth/current-org-user.decorator';
import type { OrgJwtPayload } from '../auth/current-org-user.decorator';
import { OrgJwtGuard } from '../auth/org-jwt.guard';
import { RegisterMemberDto } from './dto/register-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { TeamService } from './team.service';

// Team APIs are organisation-scoped and require the WORKFORCE module to be on.
@Controller('organisation/team')
@UseGuards(OrgJwtGuard, PlatformApprovedGuard, VerifiedOnboardingGuard, ModuleAccessGuard)
@RequireModule('WORKFORCE')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  list(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.teamService.list(user.organisationId);
  }

  @Get(':id')
  getById(@CurrentOrgUser() user: OrgJwtPayload, @Param('id') id: string) {
    return this.teamService.getById(user.organisationId, id);
  }

  // Invite a Manager, Rostering Expert, or Employee (Org Admin only).
  @Post()
  register(@CurrentOrgUser() user: OrgJwtPayload, @Body() dto: RegisterMemberDto) {
    return this.teamService.register(user.organisationId, user.role, dto);
  }

  // Update name, email, role, or status for a non-admin member.
  @Patch(':id')
  update(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.teamService.update(user.organisationId, user.role, id, dto);
  }
}
