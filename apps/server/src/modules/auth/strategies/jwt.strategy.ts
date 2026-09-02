import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { authConfig } from '../../../config/auth.config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { RequestAuthUser } from '../../../common/types/auth-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfig.jwtSecret,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role?: string;
    organisationId?: string | null;
  }): Promise<RequestAuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: true,
        organisation: { select: { status: true } },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Session invalid');
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

    return {
      sub: user.id,
      email: user.email,
      role: user.role?.code,
      organisationId: user.organisationId,
      status: user.status,
    };
  }
}
