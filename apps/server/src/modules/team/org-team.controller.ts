import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../roles/decorators/permissions.decorator';
import { PermissionsGuard } from '../roles/guards/permissions.guard';
import { RegisterTeamMemberDto } from './dto/register-team-member.dto';
import { ReopenTeamMemberDto } from './dto/reopen-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { OrgTeamService } from './org-team.service';
import { OnboardingService } from '../onboarding/onboarding.service';

@Controller('organisations/me/team')
@UseGuards(RolesGuard, PermissionsGuard)
@Roles('ORG_ADMIN')
export class OrgTeamController {
  constructor(
    private orgTeamService: OrgTeamService,
    private onboardingService: OnboardingService,
  ) {}

  @Get()
  @Permissions('view_team')
  listMembers(@Req() req: any) {
    this.assertOrgAdminHasOrg(req);
    return this.orgTeamService.listMembers(req.user.organisationId);
  }

  @Post('register')
  @Permissions('invite_team_members')
  registerMember(@Body() dto: RegisterTeamMemberDto, @Req() req: any) {
    this.assertOrgAdminHasOrg(req);
    return this.orgTeamService.registerMember(
      req.user.organisationId,
      dto,
      { userId: req.user.sub, role: req.user.role },
    );
  }

  @Get(':memberId')
  @Permissions('view_team')
  getMember(@Param('memberId') memberId: string, @Req() req: any) {
    this.assertOrgAdminHasOrg(req);
    return this.orgTeamService.getMember(req.user.organisationId, memberId);
  }

  @Patch(':memberId')
  @Permissions('deactivate_team_members')
  updateMember(
    @Param('memberId') memberId: string,
    @Body() dto: UpdateTeamMemberDto,
    @Req() req: any,
  ) {
    this.assertOrgAdminHasOrg(req);
    return this.orgTeamService.updateMember(
      req.user.organisationId,
      memberId,
      dto,
      { userId: req.user.sub, role: req.user.role },
    );
  }

  @Get(':memberId/onboarding')
  @Permissions('onboard_workers')
  getMemberOnboarding(@Param('memberId') memberId: string, @Req() req: any) {
    this.assertOrgAdminHasOrg(req);
    return this.onboardingService.getMemberOnboarding(
      req.user.organisationId,
      memberId,
    );
  }

  @Post(':memberId/approve')
  @Permissions('onboard_workers')
  approveMember(@Param('memberId') memberId: string, @Req() req: any) {
    this.assertOrgAdminHasOrg(req);
    return this.onboardingService.approveMember(
      req.user.organisationId,
      memberId,
      req.user.sub,
    );
  }

  @Post(':memberId/reopen')
  @Permissions('onboard_workers')
  reopenMember(
    @Param('memberId') memberId: string,
    @Body() dto: ReopenTeamMemberDto,
    @Req() req: any,
  ) {
    this.assertOrgAdminHasOrg(req);
    return this.orgTeamService.reopenMember(
      req.user.organisationId,
      memberId,
      req.user.sub,
      dto.reason,
    );
  }

  private assertOrgAdminHasOrg(req: any) {
    if (!req.user.organisationId) {
      throw new ForbiddenException('No organisation linked to your account');
    }
  }
}
