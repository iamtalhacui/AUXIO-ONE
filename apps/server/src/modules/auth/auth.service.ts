import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../../common/mail/mail.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlatformService } from '../platform/platform.service';
import type { OrgJwtPayload } from './current-org-user.decorator';
import {
  isPasswordPolicyValid,
  PASSWORD_POLICY_MESSAGE,
} from './password-policy';

const RESET_OTP_TTL_MS = 15 * 60 * 1000;
const RESET_OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly platform: PlatformService,
    private readonly mail: MailService,
  ) {}

  async setupAccount(rawToken: string, plainPassword: string) {
    this.ensurePasswordPolicy(plainPassword);

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

    if (await this.platform.isMaintenanceMode()) {
      throw new ForbiddenException(
        'The platform is in maintenance mode. Please try again later.',
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

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    this.ensurePasswordPolicy(newPassword);

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

  /**
   * Always returns a generic success message to avoid account enumeration.
   * Sends a 6-digit OTP only when an ACTIVE user with a password exists.
   */
  async forgotPassword(email: string) {
    const normalized = email.trim().toLowerCase();
    const generic = {
      message: 'If an account exists for that email, a reset code has been sent.',
    };

    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });

    if (!user || user.status !== 'ACTIVE' || !user.passwordHash) {
      return generic;
    }

    const otp = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const otpHash = createHash('sha256').update(otp).digest('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtpHash: otpHash,
        passwordResetExpiresAt: new Date(Date.now() + RESET_OTP_TTL_MS),
        passwordResetAttempts: 0,
      },
    });

    await this.mail.sendPasswordResetOtp(
      user.email,
      user.firstName || 'there',
      otp,
    );

    return generic;
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    this.ensurePasswordPolicy(newPassword);

    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });

    if (
      !user ||
      user.status !== 'ACTIVE' ||
      !user.passwordResetOtpHash ||
      !user.passwordResetExpiresAt
    ) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (user.passwordResetExpiresAt < new Date()) {
      await this.clearPasswordReset(user.id);
      throw new BadRequestException('Reset code has expired');
    }

    if (user.passwordResetAttempts >= RESET_OTP_MAX_ATTEMPTS) {
      await this.clearPasswordReset(user.id);
      throw new BadRequestException('Too many invalid attempts. Request a new code.');
    }

    const otpHash = createHash('sha256').update(otp.trim()).digest('hex');
    if (otpHash !== user.passwordResetOtpHash) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordResetAttempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid or expired reset code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 10),
        passwordResetOtpHash: null,
        passwordResetExpiresAt: null,
        passwordResetAttempts: 0,
      },
    });

    return { message: 'Password has been reset. You can sign in now.' };
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

  private ensurePasswordPolicy(password: string) {
    if (!isPasswordPolicyValid(password)) {
      throw new BadRequestException(PASSWORD_POLICY_MESSAGE);
    }
  }

  private async clearPasswordReset(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetOtpHash: null,
        passwordResetExpiresAt: null,
        passwordResetAttempts: 0,
      },
    });
  }

  private toUserDto(user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: string;
    onboardingStatus: string;
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
