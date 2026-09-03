import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { OrgJwtPayload } from './current-org-user.decorator';

@Injectable()
export class OrgJwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
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
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
