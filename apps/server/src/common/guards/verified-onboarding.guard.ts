import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isWorkforceOnboardingRole } from '../../modules/onboarding/onboarding-templates';
import type { OrgJwtPayload } from '../../modules/auth/current-org-user.decorator';

/**
 * Blocks workforce users from product APIs until onboardingStatus === VERIFIED.
 * Org Admins are always allowed. Use after OrgJwtGuard.
 */
@Injectable()
export class VerifiedOnboardingGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as OrgJwtPayload | undefined;

    if (!user?.sub || !user.organisationId) {
      throw new ForbiddenException('Organisation context is required');
    }

    if (user.role === 'ORG_ADMIN') {
      return true;
    }

    if (!isWorkforceOnboardingRole(user.role)) {
      return true;
    }

    const record = await this.prisma.user.findFirst({
      where: { id: user.sub, organisationId: user.organisationId },
      select: { onboardingStatus: true },
    });

    if (!record) {
      throw new ForbiddenException('User not found');
    }

    if (record.onboardingStatus !== 'VERIFIED') {
      throw new ForbiddenException(
        'Complete and verify onboarding before accessing this feature',
      );
    }

    return true;
  }
}
