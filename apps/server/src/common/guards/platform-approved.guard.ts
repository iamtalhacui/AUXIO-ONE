import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Blocks Org Admins who have not been approved by Super Admin yet.
 * Also restricts billing-suspended organisations to payment (and related)
 * routes so Org Admins can still submit proof and reactivate.
 * Other roles pass platform-approval checks; suspension is enforced at login.
 * Must run after OrgJwtGuard.
 */
@Injectable()
export class PlatformApprovedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as
      | { sub?: string; role?: string; organisationId?: string }
      | undefined;

    if (!user?.sub) {
      throw new ForbiddenException('Organisation context is required');
    }

    // Only Org Admins need platform approval / billing-suspension routing.
    if (user.role !== 'ORG_ADMIN') return true;

    const row = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: {
        platformApproved: true,
        status: true,
        organisationId: true,
        organisation: { select: { status: true } },
      },
    });

    if (!row || row.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }

    if (!row.platformApproved) {
      throw new ForbiddenException(
        'Your organisation admin account is waiting for Super Admin approval',
      );
    }

    if (row.organisation.status === 'SUSPENDED') {
      const path = String(request.originalUrl || request.url || '');
      if (!this.isAllowedWhileBillingSuspended(path)) {
        throw new ForbiddenException(
          'Organisation access is suspended due to unpaid subscription. Submit payment proof to reactivate.',
        );
      }
    }

    return true;
  }

  private isAllowedWhileBillingSuspended(path: string) {
    const base = path.split('?')[0];
    return (
      base.startsWith('/organisation/payments') ||
      base.startsWith('/organisation/notifications') ||
      base.startsWith('/auth/')
    );
  }
}
