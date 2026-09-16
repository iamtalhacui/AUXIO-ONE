import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Blocks Org Admins who have not been approved by Super Admin yet.
 * Other roles pass through. Must run after OrgJwtGuard.
 */
@Injectable()
export class PlatformApprovedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as
      | { sub?: string; role?: string }
      | undefined;

    if (!user?.sub) {
      throw new ForbiddenException('Organisation context is required');
    }

    // Only Org Admins need platform approval.
    if (user.role !== 'ORG_ADMIN') return true;

    const row = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { platformApproved: true, status: true },
    });

    if (!row || row.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }

    if (!row.platformApproved) {
      throw new ForbiddenException(
        'Your organisation admin account is waiting for Super Admin approval',
      );
    }

    return true;
  }
}
