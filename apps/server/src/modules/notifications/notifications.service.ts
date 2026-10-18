import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from 'database';
import { PrismaService } from '../../common/prisma/prisma.service';

const LIST_LIMIT = 50;

type NotifyInput = {
  type?: NotificationType;
  title: string;
  message: string;
  link?: string;
};

/**
 * Very small notification feed:
 *  - a row belongs to exactly one recipient (a User via userId, or a
 *    SuperAdmin via superAdminId).
 *  - other modules call the `notify*` helpers right after the action that
 *    matters (no events/queues/pub-sub — just a direct method call).
 *  - the controller exposes list / unread-count / mark-read / mark-all-read,
 *    scoped to whichever guard (org or platform) authenticated the caller.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Write helpers — call these from other services ──────

  /** Notify a single organisation user (any role). */
  async notifyUser(userId: string, organisationId: string, input: NotifyInput) {
    return this.prisma.notification.create({
      data: {
        userId,
        organisationId,
        type: input.type ?? 'INFO',
        title: input.title,
        message: input.message,
        link: input.link,
      },
    });
  }

  /** Notify every active user with the given role in an organisation. */
  async notifyRole(
    organisationId: string,
    role: 'ORG_ADMIN' | 'MANAGER' | 'ROSTERING_EXPERT' | 'EMPLOYEE',
    input: NotifyInput,
    options?: { excludeUserId?: string },
  ) {
    const users = await this.prisma.user.findMany({
      where: {
        organisationId,
        role,
        status: 'ACTIVE',
        ...(options?.excludeUserId
          ? { id: { not: options.excludeUserId } }
          : {}),
      },
      select: { id: true },
    });
    if (users.length === 0) return;
    await this.prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        organisationId,
        type: input.type ?? 'INFO',
        title: input.title,
        message: input.message,
        link: input.link,
      })),
    });
  }

  /** Notify every Super Admin on the platform. */
  async notifySuperAdmins(input: NotifyInput) {
    const admins = await this.prisma.superAdmin.findMany({ select: { id: true } });
    if (admins.length === 0) return;
    await this.prisma.notification.createMany({
      data: admins.map((a) => ({
        superAdminId: a.id,
        type: input.type ?? 'INFO',
        title: input.title,
        message: input.message,
        link: input.link,
      })),
    });
  }

  // ── Read helpers — used by the controller ────────────────

  async listForUser(userId: string) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: LIST_LIMIT,
      }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { items, unreadCount };
  }

  async listForSuperAdmin(superAdminId: string) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { superAdminId },
        orderBy: { createdAt: 'desc' },
        take: LIST_LIMIT,
      }),
      this.prisma.notification.count({ where: { superAdminId, isRead: false } }),
    ]);
    return { items, unreadCount };
  }

  async markRead(id: string, owner: { userId?: string; superAdminId?: string }) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    const belongsToCaller =
      (owner.userId && notification.userId === owner.userId) ||
      (owner.superAdminId && notification.superAdminId === owner.superAdminId);
    if (!belongsToCaller) throw new ForbiddenException('Not your notification');

    if (notification.isRead) return notification;
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(owner: { userId?: string; superAdminId?: string }) {
    const where = owner.userId ? { userId: owner.userId } : { superAdminId: owner.superAdminId };
    await this.prisma.notification.updateMany({
      where: { ...where, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'All notifications marked as read' };
  }
}
