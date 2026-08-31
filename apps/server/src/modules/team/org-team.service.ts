import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { ConfigurableRoleCode } from '../roles/org-permissions.constants';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrgRolesService } from '../roles/org-roles.service';
import { RegisterTeamMemberDto } from './dto/register-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamCredentialEmailService } from './team-credential-email.service';
import { assertCanRegisterTeamMembers } from './team-registration.policy';

@Injectable()
export class OrgTeamService {
  private readonly logger = new Logger(OrgTeamService.name);

  constructor(
    private prisma: PrismaService,
    private orgRolesService: OrgRolesService,
    private credentialEmailService: TeamCredentialEmailService,
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

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          organisationId,
          roleId: role.id,
          email: dto.email,
          name: dto.name,
          passwordHash,
          status: 'INVITED',
          pendingPasswordChange: true,
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
            status: created.status,
          },
        },
      });

      return created;
    });

    const organisationName =
      organisation.tradingName ?? organisation.legalName;
    const loginUrl =
      process.env.CLIENT_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

    this.queueCredentialEmail({
      to: user.email,
      memberName: user.name,
      roleName: role.name,
      organisationName,
      password: dto.password,
      loginUrl: `${loginUrl}/login`,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: user.role
        ? { code: user.role.code, name: user.role.name }
        : { code: roleCode, name: role.name },
      credentialEmail: { queued: true },
    };
  }

  private queueCredentialEmail(
    payload: Parameters<TeamCredentialEmailService['sendTeamMemberCredentials']>[0],
  ) {
    void this.credentialEmailService
      .sendTeamMemberCredentials(payload)
      .then((result) => {
        if (!result.sent) {
          this.logger.warn(
            `Credential email for ${payload.to} was not sent (${result.mode})`,
          );
        }
      })
      .catch((error) => {
        this.logger.error(
          `Failed to send credential email to ${payload.to}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
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
          },
          afterJson: {
            name: result.name,
            email: result.email,
            status: result.status,
            role: result.role?.code,
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
      role: updated.role
        ? { code: updated.role.code, name: updated.role.name }
        : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
