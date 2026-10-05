import { Injectable, Logger } from '@nestjs/common';
import type { SubscriptionStatus } from 'database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  buildBillingReminder,
  deriveSubscriptionStatus,
  toUtcDateOnly,
} from '../organisations/subscription.util';

const REMINDER_TITLE = 'Subscription renewal reminder';

@Injectable()
export class SubscriptionLifecycleService {
  private readonly logger = new Logger(SubscriptionLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Recompute subscription.status from dates and mirror SUSPENDED onto the org.
   * Does not unsuspend orgs that were suspended for non-billing reasons while
   * subscription is still healthy — only clears org suspension when we are
   * leaving a billing SUSPENDED state (payment reactivation uses approvePayment).
   */
  async syncOrganisation(organisationId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organisationId },
    });
    if (!subscription) return null;

    const nextStatus = deriveSubscriptionStatus({
      nextRenewalDate: subscription.nextRenewalDate,
      gracePeriodDays: subscription.gracePeriodDays,
    });

    if (subscription.status !== nextStatus) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: nextStatus },
      });
      subscription.status = nextStatus;
    }

    if (nextStatus === 'SUSPENDED') {
      await this.prisma.organisation.updateMany({
        where: { id: organisationId, status: { not: 'SUSPENDED' } },
        data: { status: 'SUSPENDED' },
      });
    }

    return subscription;
  }

  /** Sync every organisation subscription (used by Super Admin payments views). */
  async syncAll() {
    const rows = await this.prisma.subscription.findMany({
      select: { organisationId: true },
    });
    for (const row of rows) {
      try {
        await this.syncOrganisation(row.organisationId);
      } catch (error) {
        this.logger.warn(
          `Failed to sync subscription for org ${row.organisationId}`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  /**
   * Daily in-app reminder for Org Admins during EXPIRING_SOON / GRACE_PERIOD /
   * SUSPENDED. Deduped to one notification per user per UTC day.
   */
  async maybeSendDailyReminder(organisationId: string, userId: string) {
    const subscription = await this.syncOrganisation(organisationId);
    if (!subscription) return null;

    const reminder = buildBillingReminder({
      status: subscription.status,
      nextRenewalDate: subscription.nextRenewalDate,
      gracePeriodDays: subscription.gracePeriodDays,
    });

    if (!reminder.active || !reminder.message) {
      return { subscription, reminder };
    }

    if (
      subscription.status !== 'EXPIRING_SOON' &&
      subscription.status !== 'GRACE_PERIOD' &&
      subscription.status !== 'SUSPENDED'
    ) {
      return { subscription, reminder };
    }

    const dayStart = toUtcDateOnly(new Date());
    const alreadySent = await this.prisma.notification.findFirst({
      where: {
        userId,
        title: REMINDER_TITLE,
        createdAt: { gte: dayStart },
      },
      select: { id: true },
    });

    if (!alreadySent) {
      await this.notifications.notifyUser(userId, organisationId, {
        type: 'WARNING',
        title: REMINDER_TITLE,
        message: reminder.message,
        link: '/org-admin/payments',
      });
    }

    return { subscription, reminder };
  }

  isReminderStatus(status: SubscriptionStatus | string) {
    return (
      status === 'EXPIRING_SOON' ||
      status === 'GRACE_PERIOD' ||
      status === 'SUSPENDED'
    );
  }
}
