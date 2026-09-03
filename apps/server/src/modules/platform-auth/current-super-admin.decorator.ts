import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export type PlatformJwtPayload = {
  sub: string;
  email: string;
  typ: 'platform';
};

export const CurrentSuperAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): PlatformJwtPayload => {
    const user = context.switchToHttp().getRequest().user as
      | PlatformJwtPayload
      | undefined;

    if (!user?.sub || user.typ !== 'platform') {
      throw new UnauthorizedException();
    }

    return user;
  },
);
