import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { PlatformJwtPayload } from './current-super-admin.decorator';

@Injectable()
export class PlatformAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    const passwordOk = superAdmin
      ? await bcrypt.compare(password, superAdmin.passwordHash)
      : false;

    if (!superAdmin || !passwordOk) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: PlatformJwtPayload = {
      sub: superAdmin.id,
      email: superAdmin.email,
      typ: 'platform',
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
      },
    };
  }

  async getMe(id: string) {
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });

    if (!superAdmin) {
      throw new UnauthorizedException();
    }

    return superAdmin;
  }
}
