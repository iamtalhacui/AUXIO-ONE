import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PlatformService } from '../platform/platform.service';
import type { OrgJwtPayload } from './current-org-user.decorator';

@Injectable()
export class OrgJwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly platform: PlatformService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization as string | undefined;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const payload = this.jwt.verify<OrgJwtPayload>(header.slice(7));
      if (payload.typ !== 'org' || !payload.sub || !payload.organisationId) {
        throw new UnauthorizedException();
      }
      request.user = payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired access token');
    }

    // Super Admin routes are not guarded here. Org users get 403 while
    // maintenance is on; the client then clears the org session.
    const maintenance = await this.platform.getMaintenanceStatus();
    if (maintenance.active) {
      throw new ForbiddenException(
        maintenance.message ||
          'The platform is in maintenance mode. Please try again later.',
      );
    }

    return true;
  }
}
