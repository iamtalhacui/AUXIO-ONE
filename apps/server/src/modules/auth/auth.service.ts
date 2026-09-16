import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlatformService } from '../platform/platform.service';
import type { OrgJwtPayload } from './current-org-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly platform: PlatformService,
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
        // Org Admin still needs Super Admin approval before full access.
        platformApproved: user.role === 'ORG_ADMIN' ? false : user.platformApproved,
      },
    });

    return {
      message:
        user.role === 'ORG_ADMIN'
          ? 'Password set. Waiting for Super Admin approval before you can use the platform.'
          : 'Account activated successfully',
      email: user.email,
      awaitingPlatformApproval: user.role === 'ORG_ADMIN',
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

    // Organisation logins are paused while Super Admin has maintenance on.
    if (await this.platform.isMaintenanceMode()) {
      throw new ForbiddenException(
        'The platform is in maintenance mode. Please try again later.',
      );
    }

    // Approved users cannot use a suspended organisation.
    // Unapproved Org Admins may still sign in to see the waiting screen.
    const awaitingApproval =
      user.role === 'ORG_ADMIN' && !user.platformApproved;
    if (user.organisation.status === 'SUSPENDED' && !awaitingApproval) {
      throw new ForbiddenException(
        'This organisation is suspended. Contact the platform administrator.',
      );
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

  // Logged-in org users change their own password (current password required).
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE' || !user.passwordHash) {
      throw new UnauthorizedException();
    }

    const currentOk = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!currentOk) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from the current password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });

    return { message: 'Password updated' };
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
    onboardingStatus: string;
    platformApproved: boolean;
    organisationId: string;
  }) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
      onboardingStatus: user.onboardingStatus,
      platformApproved: user.platformApproved,
      organisationId: user.organisationId,
    };
  }

  private toOrgDto(org: {
    id: string;
    name: string;
    tradingName: string | null;
    tagline: string | null;
    timezone: string;
    email: string;
    phone: string | null;
    brandColor: string;
    logoKey: string | null;
    plan: string;
    status: string;
  }) {
    return {
      id: org.id,
      name: org.name,
      tradingName: org.tradingName,
      tagline: org.tagline,
      timezone: org.timezone,
      email: org.email,
      phone: org.phone,
      brandColor: org.brandColor,
      hasLogo: Boolean(org.logoKey),
      plan: org.plan,
      status: org.status,
    };
  }
}
