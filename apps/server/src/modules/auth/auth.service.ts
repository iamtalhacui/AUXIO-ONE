import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { UserStatus } from '@repo/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { isWorkforceLifecycleRole } from '../../common/user-lifecycle';
import { InviteTokenService } from '../../common/invite/invite-token.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private inviteTokenService: InviteTokenService,
  ) {}

  async login(email: string, password: string) {
    const matches = await this.prisma.user.findMany({
      where: { email },
      include: { role: true, organisation: true },
    });

    if (matches.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (matches.length > 1) {
      throw new UnauthorizedException(
        'This email is linked to multiple organisations. Contact support.',
      );
    }

    const user = matches[0];

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Please accept your invitation and set a password before signing in',
      );
    }

    if (user.status === 'DEACTIVATED') {
      throw new UnauthorizedException('Account deactivated');
    }

    if (user.organisation?.status === 'SUSPENDED') {
      throw new UnauthorizedException('Organisation suspended');
    }

    if (user.organisation?.status === 'CLOSED') {
      throw new UnauthorizedException('Organisation closed');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let status: UserStatus = user.status;
    if (status === 'INVITED') {
      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data: { status: 'PROCESSING' },
        select: { status: true },
      });
      status = updated.status;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.code,
      organisationId: user.organisationId,
    };

    return {
      accessToken: this.jwt.sign(payload),
      mustChangePassword: user.pendingPasswordChange,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role?.code,
        organisationId: user.organisationId,
        status,
        serviceLine: user.serviceLine,
      },
    };
  }

  async acceptInvite(token: string, password: string) {
    const inviteTokenHash = this.inviteTokenService.hashToken(token);

    const user = await this.prisma.user.findFirst({
      where: { inviteTokenHash },
      include: { role: true },
    });

    if (!user?.inviteExpiresAt || user.inviteExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invitation link is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const isOrgAdmin = user.role?.code === 'ORG_ADMIN';

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        inviteTokenHash: null,
        inviteExpiresAt: null,
        pendingPasswordChange: false,
        status: isOrgAdmin ? 'ACTIVE' : 'INVITED',
      },
    });

    return {
      success: true,
      email: user.email,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { role: true },
    });

    if (!user.passwordHash) {
      throw new BadRequestException('No password set');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const roleCode = user.role?.code;

    const data: {
      passwordHash: string;
      pendingPasswordChange: boolean;
      status?: UserStatus;
    } = {
      passwordHash: newHash,
      pendingPasswordChange: false,
    };

    if (user.status === 'INVITED') {
      data.status = 'PROCESSING';
    }

    if (
      isWorkforceLifecycleRole(roleCode) &&
      user.status !== 'VERIFIED' &&
      user.status !== 'SUBMITTED'
    ) {
      data.status = 'PROCESSING';
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        organisationId: true,
        status: true,
        serviceLine: true,
        role: { select: { code: true } },
      },
    });

    return {
      success: true,
      mustChangePassword: false,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role?.code,
        organisationId: updated.organisationId,
        status: updated.status,
        serviceLine: updated.serviceLine,
      },
    };
  }
}
