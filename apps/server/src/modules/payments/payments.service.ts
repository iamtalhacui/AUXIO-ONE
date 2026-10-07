import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LocalFileStorageService } from '../../common/storage/local-file-storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlatformService } from '../platform/platform.service';
import { SubscriptionLifecycleService } from '../subscriptions/subscription-lifecycle.service';
import {
  addUtcDays,
  buildBillingReminder,
  calculateNextRenewalDate,
  calculateRenewalPeriodStart,
  canSubmitSubscriptionPayment,
  defaultSubscriptionAmountCents,
  SUBSCRIPTION_REMINDER_DAYS,
  toSubscriptionDto,
  toUtcDateOnly,
} from '../organisations/subscription.util';
import type { SubmitPaymentDto } from './dto/submit-payment.dto';

const ALLOWED_PROOF_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const MAX_PROOF_BYTES = 8 * 1024 * 1024;

type ProofUpload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalFileStorageService,
    private readonly lifecycle: SubscriptionLifecycleService,
    private readonly notifications: NotificationsService,
    private readonly platform: PlatformService,
  ) {}

  private assertOrgAdmin(role: string) {
    if (role !== 'ORG_ADMIN') {
      throw new ForbiddenException('Only organisation admins can manage payments');
    }
  }

  async getBillingSummary(organisationId: string, role: string) {
    this.assertOrgAdmin(role);
    await this.lifecycle.syncOrganisation(organisationId);

    const [subscription, latestPayment, pendingCount] = await Promise.all([
      this.prisma.subscription.findUnique({ where: { organisationId } }),
      this.prisma.payment.findFirst({
        where: { organisationId },
        orderBy: { createdAt: 'desc' },
        include: {
          submittedBy: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.payment.count({
        where: { organisationId, status: 'PENDING_APPROVAL' },
      }),
    ]);

    if (!subscription) {
      throw new NotFoundException('No subscription found for this organisation');
    }

    // Backfill list price for orgs created before amountCents existed.
    let amountCents = subscription.amountCents;
    if (!amountCents) {
      amountCents = defaultSubscriptionAmountCents(
        subscription.plan,
        subscription.billingCycle,
      );
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { amountCents },
      });
      subscription.amountCents = amountCents;
    }

    const reminder = buildBillingReminder({
      status: subscription.status,
      nextRenewalDate: subscription.nextRenewalDate,
      gracePeriodDays: subscription.gracePeriodDays,
    });

    const inSubmitWindow = canSubmitSubscriptionPayment(subscription.status);

    return {
      subscription: toSubscriptionDto(subscription),
      latestPayment: latestPayment ? this.toPaymentDto(latestPayment) : null,
      hasPendingPayment: pendingCount > 0,
      canSubmitPayment: inSubmitWindow && pendingCount === 0,
      reminder,
    };
  }

  async listPayments(organisationId: string, role: string) {
    this.assertOrgAdmin(role);

    const payments = await this.prisma.payment.findMany({
      where: { organisationId },
      orderBy: { createdAt: 'desc' },
      include: {
        submittedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    return payments.map((row) => this.toPaymentDto(row));
  }

  async submitPayment(
    organisationId: string,
    userId: string,
    role: string,
    dto: SubmitPaymentDto,
    file: ProofUpload | undefined,
  ) {
    this.assertOrgAdmin(role);

    if (!file) {
      throw new BadRequestException('Payment proof file is required');
    }
    if (!ALLOWED_PROOF_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Proof must be PNG, JPEG, WebP, GIF, or PDF',
      );
    }
    if (file.size > MAX_PROOF_BYTES) {
      throw new BadRequestException('Proof must be 8 MB or smaller');
    }

    const buffer =
      file.buffer ?? (file.path ? readFileSync(file.path) : undefined);
    if (!buffer?.length) {
      throw new BadRequestException('Payment proof file is required');
    }

    let paymentDate: Date;
    try {
      paymentDate = toUtcDateOnly(dto.paymentDate);
    } catch {
      throw new BadRequestException(
        'paymentDate must be a valid date (YYYY-MM-DD)',
      );
    }

    const reference = dto.reference.trim();
    if (!reference) {
      throw new BadRequestException('Payment reference is required');
    }

    await this.lifecycle.syncOrganisation(organisationId);

    const subscription = await this.prisma.subscription.findUnique({
      where: { organisationId },
      include: { organisation: { select: { name: true } } },
    });
    if (!subscription) {
      throw new NotFoundException('No subscription found for this organisation');
    }

    if (!canSubmitSubscriptionPayment(subscription.status)) {
      const windowOpens = addUtcDays(
        subscription.nextRenewalDate,
        -SUBSCRIPTION_REMINDER_DAYS,
      );
      throw new BadRequestException(
        `Payment can only be submitted within ${SUBSCRIPTION_REMINDER_DAYS} days of renewal, during grace, or when suspended. You can submit from ${windowOpens.toISOString().slice(0, 10)}.`,
      );
    }

    const pending = await this.prisma.payment.findFirst({
      where: { organisationId, status: 'PENDING_APPROVAL' },
      select: { id: true },
    });
    if (pending) {
      throw new BadRequestException(
        'A payment is already awaiting Super Admin approval',
      );
    }

    let amountCents = subscription.amountCents;
    if (!amountCents) {
      amountCents = defaultSubscriptionAmountCents(
        subscription.plan,
        subscription.billingCycle,
      );
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { amountCents },
      });
    }

    const paymentId = randomUUID();
    const proofStorageKey = this.storage.buildPaymentProofKey({
      organisationId,
      paymentId,
      originalName: file.originalname || 'proof.png',
    });
    this.storage.put(proofStorageKey, buffer);

    try {
      const payment = await this.prisma.payment.create({
        data: {
          id: paymentId,
          organisationId,
          subscriptionId: subscription.id,
          amountCents,
          currency: subscription.currency || 'AUD',
          status: 'PENDING_APPROVAL',
          paymentDate,
          reference,
          notes: dto.notes?.trim() || '',
          submittedById: userId,
          proofFileName: file.originalname?.slice(0, 200) || 'proof',
          proofMimeType: file.mimetype,
          proofSizeBytes: file.size,
          proofStorageKey,
        },
        include: {
          submittedBy: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      });

      void this.notifications.notifySuperAdmins({
        type: 'INFO',
        title: 'Payment awaiting approval',
        message: `${subscription.organisation.name} submitted a payment of ${(amountCents / 100).toFixed(2)} ${subscription.currency || 'AUD'}.`,
        link: `/super-admin/payments/${payment.id}`,
      });

      return this.toPaymentDto(payment);
    } catch (error) {
      try {
        this.storage.delete(proofStorageKey);
      } catch {
        // ignore cleanup failure
      }
      throw error;
    }
  }

  async getProof(
    organisationId: string,
    role: string,
    paymentId: string,
  ) {
    this.assertOrgAdmin(role);

    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, organisationId },
      select: {
        proofStorageKey: true,
        proofMimeType: true,
        proofFileName: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const stream = this.storage.openReadStream(payment.proofStorageKey);
    return {
      file: new StreamableFile(stream),
      mimeType: payment.proofMimeType || 'application/octet-stream',
      fileName: payment.proofFileName || 'proof',
    };
  }

  // ── Super Admin ─────────────────────────────────────────

  async getPlatformPaymentsOverview() {
    await this.lifecycle.syncAll();

    const [organisations, pendingPayments] = await Promise.all([
      this.prisma.organisation.findMany({
        orderBy: { name: 'asc' },
        include: {
          subscription: true,
          payments: {
            where: { status: 'PENDING_APPROVAL' },
            select: { id: true },
          },
        },
      }),
      this.prisma.payment.findMany({
        where: { status: 'PENDING_APPROVAL' },
        orderBy: { createdAt: 'asc' },
        include: {
          organisation: { select: { id: true, name: true, plan: true } },
          submittedBy: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    return {
      organisations: organisations.map((org) => ({
        id: org.id,
        name: org.name,
        plan: org.plan,
        status: org.status,
        subscription: org.subscription
          ? toSubscriptionDto(org.subscription)
          : null,
        pendingPaymentCount: org.payments.length,
      })),
      pendingPayments: pendingPayments.map((row) =>
        this.toPlatformPaymentDto(row),
      ),
    };
  }

  async listPlatformPayments(status?: string) {
    await this.lifecycle.syncAll();

    const where =
      status && ['PENDING_APPROVAL', 'PAID', 'REJECTED'].includes(status)
        ? { status: status as 'PENDING_APPROVAL' | 'PAID' | 'REJECTED' }
        : {};

    const payments = await this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        organisation: { select: { id: true, name: true, plan: true } },
        submittedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    return payments.map((row) => this.toPlatformPaymentDto(row));
  }

  async getPlatformPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        organisation: { select: { id: true, name: true, plan: true, status: true } },
        subscription: true,
        submittedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.lifecycle.syncOrganisation(payment.organisationId);
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: payment.subscriptionId },
    });

    return {
      ...this.toPlatformPaymentDto(payment),
      organisationStatus: payment.organisation.status,
      subscription: subscription ? toSubscriptionDto(subscription) : null,
    };
  }

  async getPlatformProof(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        proofStorageKey: true,
        proofMimeType: true,
        proofFileName: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const stream = this.storage.openReadStream(payment.proofStorageKey);
    return {
      file: new StreamableFile(stream),
      mimeType: payment.proofMimeType || 'application/octet-stream',
      fileName: payment.proofFileName || 'proof',
    };
  }

  async approvePayment(paymentId: string, reviewerEmail: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        organisation: { select: { id: true, name: true } },
        subscription: true,
        submittedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Only pending payments can be approved');
    }

    const subscription = payment.subscription;
    const periodStart = calculateRenewalPeriodStart(subscription.nextRenewalDate);
    const periodEnd = calculateNextRenewalDate(
      periodStart,
      subscription.billingCycle,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const approved = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          reviewedAt: new Date(),
          reviewedByEmail: reviewerEmail,
          rejectionReason: null,
        },
        include: {
          organisation: { select: { id: true, name: true, plan: true } },
          submittedBy: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      });

      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          nextRenewalDate: periodEnd,
          status: 'ACTIVE',
        },
      });

      await tx.organisation.update({
        where: { id: payment.organisationId },
        data: { status: 'ACTIVE' },
      });

      return approved;
    });

    await this.platform.writeAudit({
      action: 'PAYMENT_APPROVED',
      actorEmail: reviewerEmail,
      organisationName: payment.organisation.name,
      details: `Approved payment ${payment.id}; renewed until ${periodEnd.toISOString().slice(0, 10)}`,
    });

    void this.notifications.notifyRole(payment.organisationId, 'ORG_ADMIN', {
      type: 'SUCCESS',
      title: 'Payment approved',
      message: `Your payment was approved. Subscription renewed until ${periodEnd.toISOString().slice(0, 10)}.`,
      link: '/org-admin/payments',
    });

    const freshSubscription = await this.prisma.subscription.findUnique({
      where: { id: subscription.id },
    });

    return {
      ...this.toPlatformPaymentDto(updated),
      organisationStatus: 'ACTIVE' as const,
      subscription: freshSubscription
        ? toSubscriptionDto(freshSubscription)
        : null,
    };
  }

  async rejectPayment(
    paymentId: string,
    reason: string,
    reviewerEmail: string,
  ) {
    const trimmed = reason.trim();
    if (!trimmed) {
      throw new BadRequestException('Rejection reason is required');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        organisation: { select: { id: true, name: true, plan: true, status: true } },
        subscription: true,
        submittedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Only pending payments can be rejected');
    }

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REJECTED',
        rejectionReason: trimmed,
        reviewedAt: new Date(),
        reviewedByEmail: reviewerEmail,
      },
      include: {
        organisation: { select: { id: true, name: true, plan: true } },
        submittedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    await this.platform.writeAudit({
      action: 'PAYMENT_REJECTED',
      actorEmail: reviewerEmail,
      organisationName: payment.organisation.name,
      details: `Rejected payment ${payment.id}: ${trimmed}`,
    });

    void this.notifications.notifyRole(payment.organisationId, 'ORG_ADMIN', {
      type: 'ERROR',
      title: 'Payment rejected',
      message: trimmed,
      link: '/org-admin/payments',
    });

    await this.lifecycle.syncOrganisation(payment.organisationId);
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: payment.subscriptionId },
    });

    return {
      ...this.toPlatformPaymentDto(updated),
      organisationStatus: payment.organisation.status,
      subscription: subscription ? toSubscriptionDto(subscription) : null,
    };
  }

  private toPaymentDto(row: {
    id: string;
    organisationId: string;
    subscriptionId: string;
    amountCents: number;
    currency: string;
    status: string;
    paymentDate: Date;
    reference: string;
    notes: string;
    rejectionReason: string | null;
    submittedById: string;
    reviewedAt: Date | null;
    reviewedByEmail: string | null;
    proofFileName: string;
    proofMimeType: string;
    proofSizeBytes: number;
    createdAt: Date;
    updatedAt: Date;
    submittedBy?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }) {
    return {
      id: row.id,
      organisationId: row.organisationId,
      subscriptionId: row.subscriptionId,
      amountCents: row.amountCents,
      currency: row.currency,
      status: row.status,
      paymentDate: row.paymentDate.toISOString().slice(0, 10),
      reference: row.reference,
      notes: row.notes,
      rejectionReason: row.rejectionReason,
      submittedById: row.submittedById,
      submittedBy: row.submittedBy
        ? {
            name: `${row.submittedBy.firstName} ${row.submittedBy.lastName}`,
            email: row.submittedBy.email,
          }
        : null,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      reviewedByEmail: row.reviewedByEmail,
      proofFileName: row.proofFileName,
      proofMimeType: row.proofMimeType,
      proofSizeBytes: row.proofSizeBytes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toPlatformPaymentDto(
    row: Parameters<PaymentsService['toPaymentDto']>[0] & {
      organisation?: { id: string; name: string; plan: string };
    },
  ) {
    return {
      ...this.toPaymentDto(row),
      organisation: row.organisation
        ? {
            id: row.organisation.id,
            name: row.organisation.name,
            plan: row.organisation.plan,
          }
        : null,
    };
  }
}
