import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export type OrgJwtPayload = {
  sub: string;
  organisationId: string;
  role: string;
  typ: 'org';
};

export const CurrentOrgUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): OrgJwtPayload => {
    const user = context.switchToHttp().getRequest().user as
      | OrgJwtPayload
      | undefined;

    if (!user?.sub || user.typ !== 'org' || !user.organisationId) {
      throw new UnauthorizedException();
    }

    return user;
  },
);
