import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { OrgJwtPayload } from './current-org-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async setupAccount(rawToken: string, plainPassword: string) {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: { setupTokenHash: tokenHash },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or already-used setup link');
    }

    if (!user.setupTokenExpiresAt || user.setupTokenExpiresAt < new Date()) {
      throw new BadRequestException('Setup link has expired');
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        setupTokenHash: null,
        setupTokenExpiresAt: null,
      },
    });

    return {
      message: 'Account activated successfully',
      email: user.email,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { organisation: true },
    });

    const passwordOk =
      user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !passwordOk) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: OrgJwtPayload = {
      sub: user.id,
      organisationId: user.organisationId,
      role: user.role,
      typ: 'org',
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      user: this.toUserDto(user),
      organisation: this.toOrgDto(user.organisation),
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organisation: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException();
    }

    return {
      user: this.toUserDto(user),
      organisation: this.toOrgDto(user.organisation),
    };
  }

  private toUserDto(user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: string;
    organisationId: string;
  }) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
      organisationId: user.organisationId,
    };
  }

  private toOrgDto(org: {
    id: string;
    name: string;
    timezone: string;
    email: string;
    phone: string | null;
    plan: string;
    status: string;
  }) {
    return {
      id: org.id,
      name: org.name,
      timezone: org.timezone,
      email: org.email,
      phone: org.phone,
      plan: org.plan,
      status: org.status,
    };
  }
}
