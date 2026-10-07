import type { BillingCycle, OrgPlan, SubscriptionStatus } from 'database';

/** Days before nextRenewalDate when status becomes EXPIRING_SOON. */
export const SUBSCRIPTION_REMINDER_DAYS = 3;

/** Normalise to UTC calendar date (midnight). */
export function toUtcDateOnly(input: string | Date): Date {
  if (typeof input === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(input.trim());
    if (!match) {
      throw new Error(`Invalid date: ${input}`);
    }
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    return new Date(Date.UTC(year, month, day));
  }

  return new Date(
    Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()),
  );
}

export function addUtcDays(date: Date, days: number): Date {
  const next = toUtcDateOnly(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Whole UTC calendar days from `from` to `to` (can be negative). */
export function utcCalendarDaysBetween(from: Date, to: Date): number {
  const a = toUtcDateOnly(from).getTime();
  const b = toUtcDateOnly(to).getTime();
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

/** End of the billing period starting on `periodStart` for the given cycle. */
export function calculateNextRenewalDate(
  periodStart: Date,
  billingCycle: BillingCycle,
): Date {
  const start = toUtcDateOnly(periodStart);
  const next = new Date(start);

  if (billingCycle === 'YEARLY') {
    next.setUTCFullYear(next.getUTCFullYear() + 1);
  } else {
    next.setUTCMonth(next.getUTCMonth() + 1);
  }

  return next;
}

/**
 * Derive lifecycle status from dates.
 * Reminder window starts SUBSCRIPTION_REMINDER_DAYS before nextRenewalDate.
 */
export function deriveSubscriptionStatus(args: {
  today?: Date;
  nextRenewalDate: Date;
  gracePeriodDays: number;
}): SubscriptionStatus {
  const today = toUtcDateOnly(args.today ?? new Date());
  const renewal = toUtcDateOnly(args.nextRenewalDate);
  const graceDays = Math.max(0, args.gracePeriodDays);
  const graceEnd = addUtcDays(renewal, graceDays);
  const daysUntilRenewal = utcCalendarDaysBetween(today, renewal);

  if (today.getTime() > graceEnd.getTime()) {
    return 'SUSPENDED';
  }
  if (today.getTime() > renewal.getTime()) {
    return 'GRACE_PERIOD';
  }
  if (daysUntilRenewal <= SUBSCRIPTION_REMINDER_DAYS) {
    return 'EXPIRING_SOON';
  }
  return 'ACTIVE';
}

/** Period start after Super Admin approves payment (full period from today if overdue). */
export function calculateRenewalPeriodStart(
  currentNextRenewalDate: Date,
  today: Date = new Date(),
): Date {
  const renewal = toUtcDateOnly(currentNextRenewalDate);
  const now = toUtcDateOnly(today);
  return renewal.getTime() > now.getTime() ? renewal : now;
}

/** Simple list prices (AUD cents) until Super Admin can override per org. */
export function defaultSubscriptionAmountCents(
  plan: OrgPlan | string,
  billingCycle: BillingCycle | string,
): number {
  const monthly =
    plan === 'BASIC' ? 9900 : plan === 'ADVANCED' ? 19900 : 24900;
  return billingCycle === 'YEARLY' ? monthly * 10 : monthly;
}

export function toSubscriptionDto(row: {
  id: string;
  organisationId: string;
  plan: string;
  billingCycle: string;
  amountCents: number;
  currency: string;
  startDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextRenewalDate: Date;
  autoRenewal: boolean;
  status: string;
  gracePeriodDays: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    organisationId: row.organisationId,
    plan: row.plan,
    billingCycle: row.billingCycle,
    amountCents: row.amountCents,
    currency: row.currency,
    startDate: row.startDate.toISOString().slice(0, 10),
    currentPeriodStart: row.currentPeriodStart.toISOString().slice(0, 10),
    currentPeriodEnd: row.currentPeriodEnd.toISOString().slice(0, 10),
    nextRenewalDate: row.nextRenewalDate.toISOString().slice(0, 10),
    autoRenewal: row.autoRenewal,
    status: row.status,
    gracePeriodDays: row.gracePeriodDays,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Org Admins may submit renewal payment proof only in the reminder window
 * (within SUBSCRIPTION_REMINDER_DAYS of nextRenewalDate), during grace, or
 * when already suspended for non-payment — not while the period is healthy.
 */
export function canSubmitSubscriptionPayment(
  status: SubscriptionStatus | string,
): boolean {
  return (
    status === 'EXPIRING_SOON' ||
    status === 'GRACE_PERIOD' ||
    status === 'SUSPENDED'
  );
}

export function buildBillingReminder(args: {
  status: SubscriptionStatus | string;
  nextRenewalDate: Date;
  gracePeriodDays: number;
  today?: Date;
}) {
  const today = toUtcDateOnly(args.today ?? new Date());
  const renewal = toUtcDateOnly(args.nextRenewalDate);
  const daysUntilRenewal = utcCalendarDaysBetween(today, renewal);
  const graceEndsOn = addUtcDays(renewal, Math.max(0, args.gracePeriodDays));

  if (args.status === 'EXPIRING_SOON') {
    return {
      active: true as const,
      kind: 'EXPIRING_SOON' as const,
      message:
        daysUntilRenewal <= 0
          ? 'Your subscription renews today. Submit payment proof to avoid interruption.'
          : `Your subscription renews in ${daysUntilRenewal} day${daysUntilRenewal === 1 ? '' : 's'}. Submit payment proof to stay active.`,
      daysUntilRenewal,
      graceEndsOn: graceEndsOn.toISOString().slice(0, 10),
    };
  }

  if (args.status === 'GRACE_PERIOD') {
    const daysLeft = Math.max(0, utcCalendarDaysBetween(today, graceEndsOn));
    return {
      active: true as const,
      kind: 'GRACE_PERIOD' as const,
      message:
        daysLeft === 0
          ? 'Grace period ends today. Submit payment proof or access will be suspended.'
          : `Subscription expired. Grace period ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
      daysUntilRenewal,
      graceEndsOn: graceEndsOn.toISOString().slice(0, 10),
    };
  }

  if (args.status === 'SUSPENDED') {
    return {
      active: true as const,
      kind: 'SUSPENDED' as const,
      message:
        'Organisation access is suspended due to unpaid subscription. Submit payment proof to reactivate.',
      daysUntilRenewal,
      graceEndsOn: graceEndsOn.toISOString().slice(0, 10),
    };
  }

  return {
    active: false as const,
    kind: null,
    message: null,
    daysUntilRenewal,
    graceEndsOn: graceEndsOn.toISOString().slice(0, 10),
  };
}
