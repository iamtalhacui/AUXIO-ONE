import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../../common/mail/mail.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { RegisterMemberDto } from './dto/register-member.dto';
import type { UpdateMemberDto } from './dto/update-member.dto';

const ROLE_LABEL: Record<string, string> = {
  MANAGER: 'Manager',
  ROSTERING_EXPERT: 'Rostering Expert',
  EMPLOYEE: 'Employee',
};

const MEMBER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  status: true,
  onboardingStatus: true,
  createdAt: true,
  lastLoginAt: true,
  emailVerifiedAt: true,
} as const;

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
  ) {}

  // All users in this organisation, including the Org Admin.
  async list(organisationId: string) {
    const users = await this.prisma.user.findMany({
      where: { organisationId },
      orderBy: { createdAt: 'desc' },
      select: MEMBER_SELECT,
    });

    return users;
  }

  // Single member, still limited to the caller's organisation.
  async getById(organisationId: string, memberId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: memberId, organisationId },
      select: MEMBER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('Team member not found');
    }

    return user;
  }

  // Creates an INVITED user and emails the setup link.
  async register(
    organisationId: string,
    actorRole: string,
    dto: RegisterMemberDto,
  ) {
    if (actorRole !== 'ORG_ADMIN') {
      throw new ForbiddenException('Only organisation admins can register team members');
    }

    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const rawToken = randomBytes(32).toString('hex');
    const setupTokenHash = createHash('sha256').update(rawToken).digest('hex');
    const days = Number(process.env.INVITE_EXPIRY_DAYS ?? 7);
    const setupTokenExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { name: true },
    });

    const user = await this.prisma.user.create({
      data: {
        organisationId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email,
        role: dto.role,
        status: 'INVITED',
        onboardingStatus: 'NOT_STARTED',
        setupTokenHash,
        setupTokenExpiresAt,
      },
      select: MEMBER_SELECT,
    });

    const name = `${user.firstName} ${user.lastName}`;
    try {
      await this.mail.sendSetupEmail(user.email, name, rawToken, {
        roleLabel: ROLE_LABEL[user.role] ?? user.role,
        organisationName: organisation?.name,
      });
    } catch (error) {
      this.logger.error(`Failed to send invite email to ${user.email}`, error);
    }

    void this.notifications.notifyRole(organisationId, 'ORG_ADMIN', {
      type: 'INFO',
      title: 'New team member invited',
      message: `${name} (${ROLE_LABEL[user.role] ?? user.role}) was invited to join the team.`,
      link: `/org-admin/team/${user.id}`,
    });

    return user;
  }

  // Org Admin can edit workforce members, but not the Org Admin account itself.
  async update(
    organisationId: string,
    actorRole: string,
    memberId: string,
    dto: UpdateMemberDto,
  ) {
    if (actorRole !== 'ORG_ADMIN') {
      throw new ForbiddenException('Only organisation admins can edit team members');
    }

    const member = await this.prisma.user.findFirst({
      where: { id: memberId, organisationId },
      select: { ...MEMBER_SELECT, passwordHash: true },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (member.role === 'ORG_ADMIN') {
      throw new ForbiddenException('Organisation admin accounts cannot be edited here');
    }

    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== member.id) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    if (dto.status === 'ACTIVE' && !member.passwordHash) {
      throw new BadRequestException(
        'This member has not set a password yet, so they cannot be marked active',
      );
    }

    return this.prisma.user.update({
      where: { id: member.id },
      data: {
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName?.trim(),
        email: dto.email?.trim().toLowerCase(),
        role: dto.role,
        status: dto.status,
      },
      select: MEMBER_SELECT,
    });
  }
}
