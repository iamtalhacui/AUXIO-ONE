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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'DEACTIVATED') {
      throw new UnauthorizedException('Account deactivated');
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
      },
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
      },
    };
  }
}
