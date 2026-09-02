import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { ConfigurableRoleCode } from '../roles/org-permissions.constants';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrgRolesService } from '../roles/org-roles.service';
import { RegisterTeamMemberDto } from './dto/register-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { InviteEmailService } from '../../common/mail/invite-email.service';
import { InviteTokenService } from '../../common/invite/invite-token.service';
import { buildInviteUrl } from '../../common/config/client-url';
import { assertCanRegisterTeamMembers } from './team-registration.policy';

@Injectable()
export class OrgTeamService {
  private readonly logger = new Logger(OrgTeamService.name);

  constructor(
    private prisma: PrismaService,
    private orgRolesService: OrgRolesService,
    private inviteEmailService: InviteEmailService,
    private inviteTokenService: InviteTokenService,
  ) {}

  async listMembers(organisationId: string) {
    await this.assertOrganisationExists(organisationId);

    const members = await this.prisma.user.findMany({
      where: { organisationId },
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
        members: members.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        status: member.status,
        serviceLine: member.serviceLine,
        role: member.role
          ? { code: member.role.code, name: member.role.name }
          : null,
        createdAt: member.createdAt.toISOString(),
      })),
    };
  }

  async registerMember(
    organisationId: string,
    dto: RegisterTeamMemberDto,
    actor: { userId: string; role?: string },
  ) {
    assertCanRegisterTeamMembers(actor.role);
    await this.assertOrganisationExists(organisationId);
    await this.orgRolesService.ensureOrgRolesForOrganisation(organisationId);

    const organisation = await this.prisma.organisation.findUniqueOrThrow({
      where: { id: organisationId },
      select: {
        legalName: true,
        tradingName: true,
      },
    });

    const roleCode = dto.role as ConfigurableRoleCode;
    const role = await this.prisma.role.findFirst({
      where: { organisationId, code: roleCode },
    });

    if (!role) {
      throw new NotFoundException(
        `Role ${roleCode} is not configured for this organisation`,
      );
    }

    const existing = await this.prisma.user.findFirst({
      where: { organisationId, email: dto.email },
    });

    if (existing) {
      throw new ConflictException(
        `A user with email ${dto.email} already exists in this organisation`,
      );
    }

    const invite = this.inviteTokenService.generate();

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          organisationId,
          roleId: role.id,
          email: dto.email,
          name: dto.name,
          status: 'INVITED',
          serviceLine: dto.serviceLine,
          inviteTokenHash: invite.hash,
          inviteExpiresAt: invite.expiresAt,
        },
        include: { role: true },
      });

      await tx.auditEntry.create({
        data: {
          organisationId,
          actorUserId: actor.userId,
          action: 'TEAM_MEMBER_REGISTER',
          entityType: 'User',
          entityId: created.id,
          afterJson: {
            email: created.email,
            name: created.name,
            role: roleCode,
            serviceLine: dto.serviceLine,
            status: created.status,
          },
        },
      });

      return created;
    });

    const organisationName =
      organisation.tradingName ?? organisation.legalName;

    const emailResult = await this.inviteEmailService.sendInvite({
      to: user.email,
      recipientName: user.name,
      roleName: role.name,
      organisationName,
      inviteUrl: buildInviteUrl(invite.token),
      expiresAt: invite.expiresAt,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: user.role
        ? { code: user.role.code, name: user.role.name }
        : { code: roleCode, name: role.name },
      inviteEmail: {
        queued: true,
        sent: emailResult.sent,
        ...(emailResult.error ? { error: emailResult.error } : {}),
      },
    };
  }

  private async assertOrganisationExists(organisationId: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { id: true },
    });

    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }
  }

  async getMember(organisationId: string, memberId: string) {
    await this.assertOrganisationExists(organisationId);

    const member = await this.prisma.user.findFirst({
      where: { id: memberId, organisationId },
      include: { role: true },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      status: member.status,
      serviceLine: member.serviceLine,
      role: member.role
        ? { code: member.role.code, name: member.role.name }
        : null,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    };
  }

  async updateMember(
    organisationId: string,
    memberId: string,
    dto: UpdateTeamMemberDto,
    actor: { userId: string; role?: string },
  ) {
    await this.assertOrganisationExists(organisationId);

    const member = await this.prisma.user.findFirst({
      where: { id: memberId, organisationId },
      include: { role: true },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (member.role?.code === 'ORG_ADMIN') {
      throw new ConflictException('Organisation admin accounts cannot be edited here');
    }

    if (memberId === actor.userId) {
      throw new ConflictException('You cannot edit your own account from the team list');
    }

    if (dto.email && dto.email !== member.email) {
      const existing = await this.prisma.user.findFirst({
        where: { organisationId, email: dto.email, NOT: { id: memberId } },
      });
      if (existing) {
        throw new ConflictException(`Email ${dto.email} is already in use`);
      }
    }

    let roleId = member.roleId;
    if (dto.role && dto.role !== member.role?.code) {
      await this.orgRolesService.ensureOrgRolesForOrganisation(organisationId);
      const role = await this.prisma.role.findFirst({
        where: { organisationId, code: dto.role },
      });
      if (!role) {
        throw new NotFoundException(`Role ${dto.role} is not configured`);
      }
      roleId = role.id;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id: memberId },
        data: {
          name: dto.name,
          email: dto.email,
          status: dto.status,
          roleId,
          ...(dto.serviceLine !== undefined
            ? { serviceLine: dto.serviceLine }
            : {}),
        },
        include: { role: true },
      });

      await tx.auditEntry.create({
        data: {
          organisationId,
          actorUserId: actor.userId,
          action: 'TEAM_MEMBER_UPDATE',
          entityType: 'User',
          entityId: memberId,
          beforeJson: {
            name: member.name,
            email: member.email,
            status: member.status,
            role: member.role?.code,
            serviceLine: member.serviceLine,
          },
          afterJson: {
            name: result.name,
            email: result.email,
            status: result.status,
            role: result.role?.code,
            serviceLine: result.serviceLine,
          },
        },
      });

      return result;
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      status: updated.status,
      serviceLine: updated.serviceLine,
      role: updated.role
        ? { code: updated.role.code, name: updated.role.name }
        : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async reopenMember(
    organisationId: string,
    memberId: string,
    actorUserId: string,
    reason: string,
  ) {
    const member = await this.prisma.user.findFirst({
      where: { id: memberId, organisationId },
      include: { role: true },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (!['SUBMITTED', 'VERIFIED'].includes(member.status)) {
      throw new ConflictException('Only submitted or verified members can be reopened');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id: memberId },
        data: { status: 'PROCESSING' },
        include: { role: true },
      });

      await tx.auditEntry.create({
        data: {
          organisationId,
          actorUserId,
          action: 'WORKER_ONBOARDING_REOPEN',
          entityType: 'User',
          entityId: memberId,
          beforeJson: { status: member.status },
          afterJson: { status: 'PROCESSING', reason },
        },
      });

      return result;
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      status: updated.status,
      serviceLine: updated.serviceLine,
      role: updated.role
        ? { code: updated.role.code, name: updated.role.name }
        : null,
    };
  }
}

