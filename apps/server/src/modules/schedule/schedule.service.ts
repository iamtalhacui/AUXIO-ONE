import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { PermissionsService } from '../permissions/permissions.service';
import { isConfigurableRole } from 'database/role-permissions';
import type {
  CreateShiftDto,
  PreviewRecurrenceDto,
  SaveAvailabilityDto,
  SaveProgressNoteDto,
  SaveServiceLineTasksDto,
  UpdateShiftDto,
} from './dto/schedule.dto';
import {
  defaultTasksForServiceLine,
  DEFAULT_SERVICE_LINE_TASKS,
} from './default-service-line-tasks';

const ASSIGNABLE_ROLES = ['MANAGER', 'ROSTERING_EXPERT', 'EMPLOYEE'] as const;

/** Finish auto-approves when start/end stay inside these windows. */
export const LATE_START_APPROVAL_MINUTES = 15;
/** Employees may start from this many minutes before scheduled start. */
export const EARLY_START_ALLOW_MINUTES = 30;
/**
 * Max minutes before scheduled end that still auto-approves.
 * Short shifts use min(this, half duration) so a 45–60m visit cannot
 * auto-approve after doing only a small fraction of the service.
 */
export const EARLY_END_ALLOW_MINUTES = 30;
/** Finish more than this many minutes after scheduled end → approval. */
export const LATE_END_ALLOW_MINUTES = 15;

/** @deprecated Prefer the named start/end window constants above. */
export const VARIANCE_MARGIN_MINUTES = LATE_START_APPROVAL_MINUTES;

/** Early-end allow for one shift: min(30, half duration), at least 1 minute. */
export function earlyEndAllowMinutes(durationMinutes: number): number {
  const half = Math.floor(Math.max(0, durationMinutes) / 2);
  return Math.max(1, Math.min(EARLY_END_ALLOW_MINUTES, half));
}

const COVERED_STATUSES = new Set([
  'ACCEPTED',
  'IN_PROGRESS',
  'PENDING_APPROVAL',
  'APPROVED',
]);

const OPEN_ACTION_STATUSES = new Set(['DRAFT', 'UNFILLED', 'OFFERED']);

const DONE_BUCKET_STATUSES = new Set([
  'IN_PROGRESS',
  'PENDING_APPROVAL',
  'APPROVED',
]);

function dateKeyInTimeZone(d: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/**
 * Interpret YYYY-MM-DD + HH:mm as wall clock in `timeZone`, return the UTC Date.
 * Used so start/finish rules follow the organisation timezone, not date-only checks.
 */
function zonedWallTimeToUtc(dateKey: string, hhmm: string, timeZone: string): Date {
  const [y, mo, d] = dateKey.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  if (![y, mo, d, h, mi].every((n) => Number.isFinite(n))) {
    throw new BadRequestException('Invalid shift date/time');
  }

  const utcGuess = Date.UTC(y, mo - 1, d, h, mi, 0, 0);
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(utcGuess));
    const get = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value ?? NaN);
    const asSeen = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
      get('second'),
    );
    if (!Number.isFinite(asSeen)) {
      return new Date(utcGuess);
    }
    return new Date(utcGuess - (asSeen - utcGuess));
  } catch {
    return new Date(utcGuess);
  }
}

function needsFinishApproval(
  startVarianceMinutes: number,
  endVarianceMinutes: number,
  durationMinutes: number,
): boolean {
  const earlyEndAllow = earlyEndAllowMinutes(durationMinutes);
  const startedTooLate = startVarianceMinutes > LATE_START_APPROVAL_MINUTES;
  const startedTooEarly = startVarianceMinutes < -EARLY_START_ALLOW_MINUTES;
  const endedTooEarly = endVarianceMinutes < -earlyEndAllow;
  const endedTooLate = endVarianceMinutes > LATE_END_ALLOW_MINUTES;
  return startedTooLate || startedTooEarly || endedTooEarly || endedTooLate;
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Statuses visible to employees on their work list. */
const PUBLISHED_STATUSES = [
  'UNFILLED',
  'OFFERED',
  'ACCEPTED',
  'IN_PROGRESS',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
] as const;

/** Statuses that grant the employee a limited participant care view. */
const CARE_VIEW_STATUSES = [
  'OFFERED',
  'ACCEPTED',
  'IN_PROGRESS',
  'PENDING_APPROVAL',
  'APPROVED',
] as const;

/** Terminal / locked statuses that must not be edited by rostering. */
const LOCKED_EDIT_STATUSES = ['APPROVED', 'CANCELLED'] as const;

type ShiftRow = {
  id: string;
  organisationId: string;
  seriesId: string | null;
  customerId: string | null;
  locationKind: string;
  locationLabel: string;
  participantName: string;
  serviceLine: string;
  serviceTitle: string;
  date: Date;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  notes: string | null;
  progressNote: string | null;
  offeredWorkerId: string | null;
  assignedWorkerId: string | null;
  isBroadcast: boolean;
  createdById: string;
  publishedAt: Date | null;
  actualStartedAt: Date | null;
  actualEndedAt: Date | null;
  endVarianceMinutes: number | null;
  startVarianceMinutes: number | null;
  finishReason: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  offeredWorker?: { id: string; firstName: string; lastName: string } | null;
  assignedWorker?: { id: string; firstName: string; lastName: string } | null;
  reviewedBy?: { id: string; firstName: string; lastName: string } | null;
  customer?: {
    id: string;
    firstName: string;
    surname: string;
    preferredName: string | null;
    status: string;
  } | null;
  tasks?: Array<{
    id: string;
    label: string;
    sortOrder: number;
    required: boolean;
    completedAt: Date | null;
  }>;
};

@Injectable()
export class ScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly organisations: OrganisationsService,
    private readonly permissions: PermissionsService,
  ) {}

  // ─── Role helpers ───────────────────────────────────────

  private async assertSchedulePage(organisationId: string, role: string) {
    await this.permissions.assertPage(organisationId, role, 'SCHEDULE');
  }

  private async assertManageShifts(organisationId: string, role: string) {
    await this.permissions.assertAction(organisationId, role, 'MANAGE_SHIFTS');
  }

  private async assertPublishAssign(organisationId: string, role: string) {
    await this.permissions.assertAction(
      organisationId,
      role,
      'PUBLISH_ASSIGN_SHIFTS',
    );
  }

  private async assertApproveServiceDelivery(
    organisationId: string,
    role: string,
  ) {
    await this.permissions.assertAction(
      organisationId,
      role,
      'APPROVE_TIMESHEETS_SERVICE_DELIVERY',
    );
  }

  private async assertViewMyShifts(organisationId: string, role: string) {
    await this.permissions.assertAction(
      organisationId,
      role,
      'VIEW_MY_SHIFTS',
    );
  }

  private async assertManageMyAvailability(
    organisationId: string,
    role: string,
  ) {
    await this.permissions.assertAction(
      organisationId,
      role,
      'MANAGE_MY_AVAILABILITY',
    );
  }

  private async assertExecuteMyShifts(organisationId: string, role: string) {
    await this.permissions.assertAction(
      organisationId,
      role,
      'EXECUTE_MY_SHIFTS',
    );
  }

  private async assertViewMyShiftsOrTimesheets(
    organisationId: string,
    role: string,
  ) {
    await this.permissions.assertAnyAction(organisationId, role, [
      'VIEW_MY_SHIFTS',
      'VIEW_MY_TIMESHEETS',
    ]);
  }

  /** Active users whose role matrix allows ASSIGNABLE_AS_WORKER (not Org Admin). */
  private async findAssignableWorkerUsers(organisationId: string) {
    const [users, matrix] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          organisationId,
          status: 'ACTIVE',
          role: { in: [...ASSIGNABLE_ROLES] },
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          onboardingStatus: true,
          weeklyAvailability: true,
        },
      }),
      this.permissions.getMatrix(organisationId),
    ]);

    return users.filter(
      (user) =>
        isConfigurableRole(user.role) &&
        matrix[user.role].actions.ASSIGNABLE_AS_WORKER,
    );
  }

  // ─── Time helpers ───────────────────────────────────────

  /** Parse YYYY-MM-DD into a UTC midnight Date for storage. */
  private parseDateOnly(isoDate: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      throw new BadRequestException('Date must be YYYY-MM-DD');
    }
    return new Date(`${isoDate}T00:00:00.000Z`);
  }

  private formatDateOnly(d: Date): string {
    return this.calendarDateKey(d);
  }

  private parseTimeToMinutes(time: string): number {
    if (!/^\d{2}:\d{2}$/.test(time)) {
      throw new BadRequestException('Time must be HH:mm');
    }
    const [h, m] = time.split(':').map(Number);
    if (h > 23 || m > 59) {
      throw new BadRequestException('Invalid time value');
    }
    return h * 60 + m;
  }

  private minutesToTime(total: number): string {
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private assertDuration(minutes: number) {
    if (minutes < 5 || minutes % 5 !== 0) {
      throw new BadRequestException(
        'Duration must be a positive multiple of 5 minutes',
      );
    }
  }

  private endTimeFrom(startTime: string, durationMinutes: number): string {
    const end = this.parseTimeToMinutes(startTime) + durationMinutes;
    if (end > 24 * 60) {
      throw new BadRequestException(
        'Phase A shifts must end on the same calendar day',
      );
    }
    return this.minutesToTime(end);
  }

  private timesOverlap(
    aStart: string,
    aEnd: string,
    bStart: string,
    bEnd: string,
  ) {
    const as = this.parseTimeToMinutes(aStart);
    const ae = this.parseTimeToMinutes(aEnd);
    const bs = this.parseTimeToMinutes(bStart);
    const be = this.parseTimeToMinutes(bEnd);
    return as < be && bs < ae;
  }

  private isoWeekday(date: Date): number {
    // JS: Sun=0 … Sat=6 → ISO: Mon=1 … Sun=7
    const day = date.getUTCDay();
    return day === 0 ? 7 : day;
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  }

  private addMonths(date: Date, months: number): Date {
    const next = new Date(date);
    next.setUTCMonth(next.getUTCMonth() + months);
    return next;
  }

  // ─── DTO mapping ────────────────────────────────────────

  private workerName(w: { firstName: string; lastName: string } | null | undefined) {
    if (!w) return null;
    return `${w.firstName} ${w.lastName}`;
  }

  private assertOrgAdmin(role: string) {
    if (role !== 'ORG_ADMIN') {
      throw new ForbiddenException('Only Org Admins can perform this action');
    }
  }

  private toShiftDto(shift: ShiftRow) {
    return {
      id: shift.id,
      organisationId: shift.organisationId,
      seriesId: shift.seriesId,
      customerId: shift.customerId,
      locationKind: shift.locationKind,
      locationLabel: shift.locationLabel,
      participantName: shift.participantName,
      serviceLine: shift.serviceLine,
      serviceTitle: shift.serviceTitle,
      date: this.formatDateOnly(shift.date),
      startTime: shift.startTime,
      endTime: shift.endTime,
      durationMinutes: shift.durationMinutes,
      status: shift.status,
      notes: shift.notes,
      progressNote: shift.progressNote,
      offeredWorkerId: shift.offeredWorkerId,
      assignedWorkerId: shift.assignedWorkerId,
      isBroadcast: Boolean(shift.isBroadcast),
      offeredWorkerName: this.workerName(shift.offeredWorker),
      assignedWorkerName: this.workerName(shift.assignedWorker),
      publishedAt: shift.publishedAt?.toISOString() ?? null,
      actualStartedAt: shift.actualStartedAt?.toISOString() ?? null,
      actualEndedAt: shift.actualEndedAt?.toISOString() ?? null,
      startVarianceMinutes: shift.startVarianceMinutes,
      endVarianceMinutes: shift.endVarianceMinutes,
      finishReason: shift.finishReason,
      reviewedById: shift.reviewedById,
      reviewedByName: this.workerName(shift.reviewedBy),
      reviewedAt: shift.reviewedAt?.toISOString() ?? null,
      reviewNote: shift.reviewNote,
      tasks: (shift.tasks ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((t) => ({
          id: t.id,
          label: t.label,
          sortOrder: t.sortOrder,
          required: t.required,
          completedAt: t.completedAt?.toISOString() ?? null,
        })),
      createdAt: shift.createdAt.toISOString(),
      updatedAt: shift.updatedAt.toISOString(),
    };
  }

  private readonly shiftInclude = {
    offeredWorker: {
      select: { id: true, firstName: true, lastName: true },
    },
    assignedWorker: {
      select: { id: true, firstName: true, lastName: true },
    },
    reviewedBy: {
      select: { id: true, firstName: true, lastName: true },
    },
    customer: {
      select: {
        id: true,
        firstName: true,
        surname: true,
        preferredName: true,
        status: true,
      },
    },
    tasks: true,
  } as const;

  // ─── Lookups for create form ────────────────────────────

  /** Minimal participant list for Rostering Expert shift creation. */
  async listParticipants(organisationId: string, role: string) {
    await this.assertSchedulePage(organisationId, role);

    // Only activated participants — onboarding customers are not service-ready.
    const rows = await this.prisma.customer.findMany({
      where: {
        organisationId,
        status: 'ACTIVE',
      },
      orderBy: [{ surname: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        surname: true,
        preferredName: true,
        serviceLine: true,
        status: true,
        address: true,
      },
    });

    return rows.map((c) => ({
      id: c.id,
      displayName: c.preferredName
        ? `${c.preferredName} (${c.firstName} ${c.surname})`
        : `${c.firstName} ${c.surname}`,
      firstName: c.firstName,
      surname: c.surname,
      serviceLine: c.serviceLine,
      status: c.status,
      address: c.address,
    }));
  }

  /** Active assignable workers available for matching (permission-gated). */
  async listWorkers(organisationId: string, role: string) {
    await this.assertSchedulePage(organisationId, role);

    const workers = await this.findAssignableWorkerUsers(organisationId);

    return workers
      .filter((w) => w.onboardingStatus === 'VERIFIED')
      .map((w) => ({
        id: w.id,
        firstName: w.firstName,
        lastName: w.lastName,
        displayName: `${w.firstName} ${w.lastName}`,
        // Phase A readiness: verified onboarding = ready / compliance OK.
        complianceOk: w.onboardingStatus === 'VERIFIED',
        hasAvailabilityPattern: w.weeklyAvailability.some((d) => d.enabled),
      }));
  }

  // ─── List / get shifts (Rostering Expert) ───────────────

  async listShifts(
    organisationId: string,
    role: string,
    from?: string,
    to?: string,
  ) {
    await this.assertSchedulePage(organisationId, role);

    const where: {
      organisationId: string;
      date?: { gte?: Date; lte?: Date };
    } = { organisationId };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = this.parseDateOnly(from);
      if (to) where.date.lte = this.parseDateOnly(to);
    }

    const shifts = await this.prisma.shift.findMany({
      where,
      include: this.shiftInclude,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return shifts.map((s) => this.toShiftDto(s));
  }

  async getShift(organisationId: string, role: string, shiftId: string) {
    await this.assertSchedulePage(organisationId, role);
    const shift = await this.findOrgShift(organisationId, shiftId);
    return this.toShiftDto(shift);
  }

  private async findOrgShift(organisationId: string, shiftId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, organisationId },
      include: this.shiftInclude,
    });
    if (!shift) throw new NotFoundException('Shift not found');
    return shift;
  }

  // ─── Recurrence preview & create ────────────────────────

  /** Build the list of dates a recurrence would produce (not persisted). */
  async previewRecurrence(
    organisationId: string,
    role: string,
    dto: PreviewRecurrenceDto,
  ) {
    await this.assertManageShifts(organisationId, role);
    this.validateCreateInput(dto);
    const dates = this.buildOccurrenceDates(dto);
    return {
      count: dates.length,
      dates: dates.map((d) => this.formatDateOnly(d)),
    };
  }

  async createShifts(
    organisationId: string,
    actorId: string,
    role: string,
    dto: CreateShiftDto,
  ) {
    await this.assertManageShifts(organisationId, role);
    this.validateCreateInput(dto);

    // Create always saves drafts. Broadcast / assign happens from Matching.
    const resolved = await this.resolveParticipant(organisationId, dto);
    const endTime = this.endTimeFrom(dto.startTime, dto.durationMinutes);

    if (!dto.recurring) {
      const shift = await this.prisma.shift.create({
        data: {
          organisationId,
          seriesId: null,
          customerId: resolved.customerId,
          locationKind: dto.locationKind,
          locationLabel: dto.locationLabel.trim(),
          participantName: resolved.participantName,
          serviceLine: dto.serviceLine.trim(),
          serviceTitle: dto.serviceTitle.trim(),
          date: this.parseDateOnly(dto.date),
          startTime: dto.startTime,
          endTime,
          durationMinutes: dto.durationMinutes,
          status: 'DRAFT',
          isBroadcast: false,
          publishedAt: null,
          notes: dto.notes?.trim() || null,
          createdById: actorId,
        },
        include: this.shiftInclude,
      });
      await this.copyTasksOntoShift(organisationId, shift.id, shift.serviceLine);
      const withTasks = await this.findOrgShift(organisationId, shift.id);
      return { shifts: [this.toShiftDto(withTasks)], seriesId: null };
    }

    const dates = this.buildOccurrenceDates(dto);
    if (dates.length === 0) {
      throw new BadRequestException('Recurrence produced no dates');
    }
    if (dates.length > 60) {
      throw new BadRequestException(
        'Recurrence would create more than 60 shifts — shorten the period',
      );
    }

    const series = await this.prisma.shiftSeries.create({
      data: {
        organisationId,
        frequency: dto.frequency!,
        interval: dto.interval ?? 1,
        untilDate: this.parseDateOnly(dto.untilDate!),
      },
    });

    const createdIds: string[] = [];
    await this.prisma.$transaction(async (tx) => {
      for (const date of dates) {
        const row = await tx.shift.create({
          data: {
            organisationId,
            seriesId: series.id,
            customerId: resolved.customerId,
            locationKind: dto.locationKind,
            locationLabel: dto.locationLabel.trim(),
            participantName: resolved.participantName,
            serviceLine: dto.serviceLine.trim(),
            serviceTitle: dto.serviceTitle.trim(),
            date,
            startTime: dto.startTime,
            endTime,
            durationMinutes: dto.durationMinutes,
            status: 'DRAFT',
            isBroadcast: false,
            publishedAt: null,
            notes: dto.notes?.trim() || null,
            createdById: actorId,
          },
        });
        createdIds.push(row.id);
      }
    });

    for (const id of createdIds) {
      await this.copyTasksOntoShift(organisationId, id, dto.serviceLine.trim());
    }

    const created = await this.prisma.shift.findMany({
      where: { id: { in: createdIds } },
      include: this.shiftInclude,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return {
      seriesId: series.id,
      shifts: created.map((s) => this.toShiftDto(s)),
    };
  }

  private validateCreateInput(dto: CreateShiftDto | PreviewRecurrenceDto) {
    this.assertDuration(dto.durationMinutes);
    this.parseTimeToMinutes(dto.startTime);
    this.endTimeFrom(dto.startTime, dto.durationMinutes);

    if (dto.locationKind === 'PARTICIPANT' && !dto.customerId) {
      throw new BadRequestException('Select a participant');
    }
    if (!dto.locationLabel?.trim()) {
      throw new BadRequestException('Enter a location');
    }
    if (dto.recurring) {
      if (!dto.frequency || !dto.untilDate) {
        throw new BadRequestException(
          'Recurring shifts need a frequency and until date',
        );
      }
      const start = this.parseDateOnly(dto.date);
      const until = this.parseDateOnly(dto.untilDate);
      if (until < start) {
        throw new BadRequestException('Until date must be on or after start date');
      }
    }
  }

  private buildOccurrenceDates(dto: CreateShiftDto | PreviewRecurrenceDto): Date[] {
    const start = this.parseDateOnly(dto.date);
    if (!dto.recurring) return [start];

    const until = this.parseDateOnly(dto.untilDate!);
    const interval = dto.interval ?? 1;
    const dates: Date[] = [];
    let cursor = start;

    while (cursor <= until) {
      dates.push(new Date(cursor));
      cursor =
        dto.frequency === 'MONTHLY'
          ? this.addMonths(cursor, interval)
          : this.addDays(cursor, 7 * interval);
    }
    return dates;
  }

  private async resolveParticipant(
    organisationId: string,
    dto: Pick<CreateShiftDto, 'locationKind' | 'customerId' | 'locationLabel'>,
  ) {
    if (dto.locationKind === 'PARTICIPANT') {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, organisationId },
      });
      if (!customer) throw new BadRequestException('Participant not found');
      if (customer.status !== 'ACTIVE') {
        throw new BadRequestException(
          'Only active participants can be rostered. Finish customer onboarding first.',
        );
      }
      const participantName = customer.preferredName
        ? `${customer.preferredName} ${customer.surname}`
        : `${customer.firstName} ${customer.surname}`;
      return { customerId: customer.id, participantName };
    }

    // Site / Other: free-text location; keep a display label as participantName for board cards.
    return {
      customerId: null as string | null,
      participantName: dto.locationLabel.trim(),
    };
  }

  // ─── Update / cancel ────────────────────────────────────

  async updateShift(
    organisationId: string,
    role: string,
    shiftId: string,
    dto: UpdateShiftDto,
  ) {
    await this.assertManageShifts(organisationId, role);
    const shift = await this.findOrgShift(organisationId, shiftId);

    if (
      shift.status === 'APPROVED' ||
      shift.status === 'CANCELLED' ||
      shift.status === 'IN_PROGRESS' ||
      shift.status === 'PENDING_APPROVAL'
    ) {
      throw new BadRequestException('Cannot edit a shift in this status');
    }

    const scope = dto.seriesScope ?? 'THIS';
    const targets =
      scope === 'THIS_AND_FOLLOWING' && shift.seriesId
        ? await this.prisma.shift.findMany({
            where: {
              organisationId,
              seriesId: shift.seriesId,
              date: { gte: shift.date },
              status: { notIn: ['APPROVED', 'CANCELLED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'REJECTED'] },
            },
            orderBy: { date: 'asc' },
          })
        : [shift];

    const patch = await this.buildUpdatePatch(organisationId, shift, dto);

    await this.prisma.$transaction(
      targets.map((t) =>
        this.prisma.shift.update({
          where: { id: t.id },
          data: {
            ...patch,
            // Keep each occurrence's own date unless editing a single shift's date.
            date:
              scope === 'THIS' && dto.date
                ? this.parseDateOnly(dto.date)
                : t.date,
            // Recalculate end for each row when duration/start change.
            endTime:
              patch.startTime || patch.durationMinutes
                ? this.endTimeFrom(
                    (patch.startTime as string) ?? t.startTime,
                    (patch.durationMinutes as number) ?? t.durationMinutes,
                  )
                : undefined,
          },
        }),
      ),
    );

    const updated = await this.findOrgShift(organisationId, shiftId);
    return {
      updatedCount: targets.length,
      shift: this.toShiftDto(updated),
    };
  }

  private async buildUpdatePatch(
    organisationId: string,
    shift: ShiftRow,
    dto: UpdateShiftDto,
  ) {
    const locationKind = dto.locationKind ?? shift.locationKind;
    const locationLabel = dto.locationLabel?.trim() ?? shift.locationLabel;

    let customerId = shift.customerId;
    let participantName = shift.participantName;

    if (
      dto.locationKind !== undefined ||
      dto.customerId !== undefined ||
      dto.locationLabel !== undefined
    ) {
      const resolved = await this.resolveParticipant(organisationId, {
        locationKind: locationKind as CreateShiftDto['locationKind'],
        customerId: dto.customerId === undefined ? shift.customerId ?? undefined : dto.customerId ?? undefined,
        locationLabel,
      });
      customerId = resolved.customerId;
      participantName = resolved.participantName;
    }

    if (dto.durationMinutes !== undefined) {
      this.assertDuration(dto.durationMinutes);
    }
    if (dto.startTime) this.parseTimeToMinutes(dto.startTime);

    return {
      locationKind: locationKind as never,
      locationLabel,
      customerId,
      participantName,
      serviceLine: dto.serviceLine?.trim() ?? undefined,
      serviceTitle: dto.serviceTitle?.trim() ?? undefined,
      startTime: dto.startTime,
      durationMinutes: dto.durationMinutes,
      notes: dto.notes === undefined ? undefined : dto.notes.trim() || null,
    };
  }

  async cancelShift(organisationId: string, role: string, shiftId: string) {
    await this.assertManageShifts(organisationId, role);
    const shift = await this.findOrgShift(organisationId, shiftId);
    if (shift.status === 'APPROVED' || shift.status === 'IN_PROGRESS') {
      throw new BadRequestException('Cannot cancel a shift in this status');
    }
    const updated = await this.prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: 'CANCELLED',
        offeredWorkerId: null,
        assignedWorkerId: null,
      },
      include: this.shiftInclude,
    });
    return this.toShiftDto(updated);
  }

  // ─── Publish / offer / matching ─────────────────────────

  /**
   * Publish (if needed) and directly assign an eligible worker.
   * No employee accept step — availability/eligibility is checked here.
   */
  async publishAndOffer(
    organisationId: string,
    role: string,
    shiftId: string,
    workerId: string,
  ) {
    await this.assertPublishAssign(organisationId, role);
    const shift = await this.findOrgShift(organisationId, shiftId);

    if (!['DRAFT', 'UNFILLED', 'OFFERED'].includes(shift.status)) {
      throw new BadRequestException(
        'This shift cannot be assigned in its current status',
      );
    }

    const ranking = await this.evaluateWorker(organisationId, shift, workerId);
    if (!ranking.eligible) {
      throw new BadRequestException(
        `Worker is not eligible: ${ranking.blockers.join(', ')}`,
      );
    }

    const updated = await this.prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: 'ACCEPTED',
        assignedWorkerId: workerId,
        offeredWorkerId: null,
        isBroadcast: false,
        publishedAt: shift.publishedAt ?? new Date(),
      },
      include: this.shiftInclude,
    });

    void this.notifications.notifyUser(workerId, organisationId, {
      type: 'INFO',
      title: 'Shift assigned to you',
      message: `You've been assigned a ${updated.serviceTitle} shift on ${this.formatDateOnly(updated.date)} (${updated.startTime}–${updated.endTime}).`,
      link: `/my-shifts/${updated.id}`,
    });

    return this.toShiftDto(updated);
  }

  /**
   * Open (or re-open) a shift as a broadcast to all active employees.
   * Used from Matching when no suitable worker is available to assign yet —
   * someone marked unavailable can update availability and then accept.
   * First eligible accept wins; eligibility is re-checked at accept time.
   */
  async broadcastShift(organisationId: string, role: string, shiftId: string) {
    await this.assertPublishAssign(organisationId, role);
    const shift = await this.findOrgShift(organisationId, shiftId);

    const canOpen =
      shift.status === 'DRAFT' ||
      shift.status === 'UNFILLED' ||
      (shift.status === 'OFFERED' && shift.isBroadcast && !shift.offeredWorkerId);

    if (!canOpen) {
      throw new BadRequestException(
        'This shift cannot be broadcast in its current status',
      );
    }

    const isRebroadcast =
      shift.status === 'OFFERED' && shift.isBroadcast && !shift.offeredWorkerId;

    const updated = isRebroadcast
      ? shift
      : await this.prisma.shift.update({
          where: { id: shift.id },
          data: {
            status: 'OFFERED',
            isBroadcast: true,
            offeredWorkerId: null,
            assignedWorkerId: null,
            publishedAt: shift.publishedAt ?? new Date(),
          },
          include: this.shiftInclude,
        });

    await this.notifyBroadcastEligible(organisationId, updated);
    return this.toShiftDto(updated);
  }

  /** Withdraw a broadcast/open offer and leave the shift published but unfilled. */
  async withdrawOffer(organisationId: string, role: string, shiftId: string) {
    await this.assertPublishAssign(organisationId, role);
    const shift = await this.findOrgShift(organisationId, shiftId);
    if (shift.status !== 'OFFERED' || !shift.isBroadcast) {
      throw new BadRequestException('Shift does not have an open broadcast');
    }
    const updated = await this.prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: 'UNFILLED',
        offeredWorkerId: null,
        isBroadcast: false,
      },
      include: this.shiftInclude,
    });
    return this.toShiftDto(updated);
  }

  /** Notify assignable workers about a broadcast shift (eligibility re-checked on accept). */
  private async notifyBroadcastEligible(
    organisationId: string,
    shift: ShiftRow,
  ) {
    const workers = await this.findAssignableWorkerUsers(organisationId);

    for (const worker of workers) {
      void this.notifications.notifyUser(worker.id, organisationId, {
        type: 'INFO',
        title: 'Open shift available',
        message: `A ${shift.serviceTitle} shift on ${this.formatDateOnly(shift.date)} (${shift.startTime}–${shift.endTime}) is open — first to accept gets it.`,
        link: `/my-shifts/${shift.id}`,
      });
    }
  }

  /** Rank employees for a draft/unfilled/offered shift (hard rules only). */
  async listCandidates(organisationId: string, role: string, shiftId: string) {
    await this.assertPublishAssign(organisationId, role);
    const shift = await this.findOrgShift(organisationId, shiftId);

    if (!['DRAFT', 'UNFILLED', 'OFFERED'].includes(shift.status)) {
      return [];
    }

    const workers = await this.findAssignableWorkerUsers(organisationId);

    // Collect matching scores for every assignable worker (hard rules only).
    type CandidateRow = {
      workerId: string;
      displayName: string;
      eligible: boolean;
      complianceOk: boolean;
      availability: 'FULL' | 'PARTIAL' | 'UNAVAILABLE';
      hasConflict: boolean;
      blockers: string[];
    };

    const ranked: CandidateRow[] = [];
    for (const worker of workers) {
      const result = await this.evaluateWorker(organisationId, shift, worker.id);
      ranked.push({
        workerId: worker.id,
        displayName: `${worker.firstName} ${worker.lastName}`,
        ...result,
      });
    }

    // Fully eligible first, then partial, then blocked.
    ranked.sort((a, b) => {
      const score = (r: CandidateRow) =>
        r.eligible ? 2 : r.availability === 'PARTIAL' ? 1 : 0;
      return score(b) - score(a);
    });

    return ranked;
  }

  private async evaluateWorker(
    organisationId: string,
    shift: ShiftRow,
    workerId: string,
  ) {
    const worker = await this.prisma.user.findFirst({
      where: {
        id: workerId,
        organisationId,
        role: { in: [...ASSIGNABLE_ROLES] },
      },
    });
    if (!worker || worker.status !== 'ACTIVE') {
      return {
        eligible: false,
        complianceOk: false,
        availability: 'UNAVAILABLE' as const,
        hasConflict: false,
        blockers: ['Worker not found or inactive'],
      };
    }

    const blockers: string[] = [];

    const assignable =
      isConfigurableRole(worker.role) &&
      (await this.permissions.hasAction(
        organisationId,
        worker.role,
        'ASSIGNABLE_AS_WORKER',
      ));
    if (!assignable) blockers.push('Not assignable as a worker');

    const complianceOk = worker.onboardingStatus === 'VERIFIED';
    if (!complianceOk) blockers.push('Not ready / onboarding incomplete');

    const availability = await this.getAvailabilityForShift(workerId, shift);
    if (availability === 'UNAVAILABLE') blockers.push('Unavailable');
    if (availability === 'PARTIAL') blockers.push('Only partially available');

    const hasConflict = await this.workerHasConflict(organisationId, workerId, shift);
    if (hasConflict) blockers.push('Scheduling conflict');

    // Fully ready = assignable + verified + fully available + no conflict.
    // Partial availability must never look fully ready (OX-032).
    const eligible =
      assignable && complianceOk && availability === 'FULL' && !hasConflict;

    return {
      eligible,
      complianceOk,
      availability,
      hasConflict,
      blockers,
    };
  }

  private async workerHasConflict(
    organisationId: string,
    workerId: string,
    candidate: Pick<ShiftRow, 'id' | 'date' | 'startTime' | 'endTime'>,
  ) {
    const others = await this.prisma.shift.findMany({
      where: {
        organisationId,
        id: { not: candidate.id },
        date: candidate.date,
        status: { in: ['OFFERED', 'ACCEPTED', 'IN_PROGRESS'] },
        OR: [
          { offeredWorkerId: workerId },
          { assignedWorkerId: workerId },
        ],
      },
    });

    return others.some((s) =>
      this.timesOverlap(s.startTime, s.endTime, candidate.startTime, candidate.endTime),
    );
  }

  /**
   * FULL = weekly band fully covers the shift and no exception.
   * PARTIAL = some overlap but not full cover.
   * UNAVAILABLE = exception day or no overlap / disabled day.
   */
  private async getAvailabilityForShift(
    workerId: string,
    shift: Pick<ShiftRow, 'date' | 'startTime' | 'endTime'>,
  ): Promise<'FULL' | 'PARTIAL' | 'UNAVAILABLE'> {
    const exceptions = await this.prisma.availabilityException.findMany({
      where: {
        userId: workerId,
        fromDate: { lte: shift.date },
        toDate: { gte: shift.date },
      },
    });
    if (exceptions.length > 0) return 'UNAVAILABLE';

    const dayOfWeek = this.isoWeekday(shift.date);
    const band = await this.prisma.workerAvailability.findUnique({
      where: { userId_dayOfWeek: { userId: workerId, dayOfWeek } },
    });

    // No pattern saved yet → treat as unknown/unavailable for hard matching.
    if (!band || !band.enabled) return 'UNAVAILABLE';

    const shiftStart = this.parseTimeToMinutes(shift.startTime);
    const shiftEnd = this.parseTimeToMinutes(shift.endTime);
    const availStart = this.parseTimeToMinutes(band.startTime);
    const availEnd = this.parseTimeToMinutes(band.endTime);

    if (shiftStart >= availStart && shiftEnd <= availEnd) return 'FULL';
    if (shiftStart < availEnd && availStart < shiftEnd) return 'PARTIAL';
    return 'UNAVAILABLE';
  }

  // ─── Employee: my shifts ────────────────────────────────

  async listMyShifts(organisationId: string, userId: string, role: string) {
    await this.assertViewMyShiftsOrTimesheets(organisationId, role);

    const shifts = await this.prisma.shift.findMany({
      where: {
        organisationId,
        OR: [
          { offeredWorkerId: userId, status: 'OFFERED' },
          { isBroadcast: true, status: 'OFFERED' },
          { assignedWorkerId: userId },
        ],
      },
      include: this.shiftInclude,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    // Never expose draft planning details to employees.
    return shifts
      .filter((s) => PUBLISHED_STATUSES.includes(s.status as (typeof PUBLISHED_STATUSES)[number]))
      .map((s) => this.toShiftDto(s));
  }

  async getMyShift(
    organisationId: string,
    userId: string,
    role: string,
    shiftId: string,
  ) {
    await this.assertViewMyShifts(organisationId, role);
    const shift = await this.prisma.shift.findFirst({
      where: {
        id: shiftId,
        organisationId,
        OR: [
          { offeredWorkerId: userId, status: 'OFFERED' },
          { isBroadcast: true, status: 'OFFERED' },
          { assignedWorkerId: userId },
        ],
      },
      include: this.shiftInclude,
    });
    if (!shift || shift.status === 'DRAFT') {
      throw new NotFoundException('Shift not found');
    }
    return this.toShiftDto(shift);
  }

  async acceptOffer(
    organisationId: string,
    userId: string,
    role: string,
    shiftId: string,
  ) {
    await this.assertViewMyShifts(organisationId, role);
    const shift = await this.findOrgShift(organisationId, shiftId);

    const isPersonalOffer =
      shift.status === 'OFFERED' && shift.offeredWorkerId === userId;
    const isBroadcastOffer =
      shift.status === 'OFFERED' && shift.isBroadcast && !shift.offeredWorkerId;

    if (!isPersonalOffer && !isBroadcastOffer) {
      throw new BadRequestException('No open offer for you on this shift');
    }

    const ranking = await this.evaluateWorker(organisationId, shift, userId);
    if (!ranking.eligible) {
      throw new BadRequestException(
        `Cannot accept — ${ranking.blockers.join(', ') || 'not eligible'}`,
      );
    }

    // First-accept-wins for broadcasts (and safe claim for personal offers).
    const claimed = await this.prisma.shift.updateMany({
      where: {
        id: shift.id,
        organisationId,
        status: 'OFFERED',
        ...(isBroadcastOffer
          ? { isBroadcast: true, offeredWorkerId: null }
          : { offeredWorkerId: userId }),
      },
      data: {
        status: 'ACCEPTED',
        assignedWorkerId: userId,
        offeredWorkerId: null,
        isBroadcast: false,
      },
    });

    if (claimed.count === 0) {
      throw new BadRequestException(
        'This shift was just taken by someone else',
      );
    }

    const updated = await this.findOrgShift(organisationId, shift.id);

    void this.notifications.notifyUser(shift.createdById, organisationId, {
      type: 'SUCCESS',
      title: isBroadcastOffer ? 'Broadcast shift filled' : 'Shift offer accepted',
      message: `${updated.assignedWorker?.firstName ?? 'A worker'} accepted the ${updated.serviceTitle} shift on ${this.formatDateOnly(updated.date)}.`,
      link: '/schedule',
    });

    return this.toShiftDto(updated);
  }

  async declineOffer(
    organisationId: string,
    userId: string,
    role: string,
    shiftId: string,
  ) {
    await this.assertViewMyShifts(organisationId, role);
    const shift = await this.findOrgShift(organisationId, shiftId);

    if (shift.isBroadcast && shift.status === 'OFFERED' && !shift.offeredWorkerId) {
      throw new BadRequestException(
        'Broadcast shifts stay open for others — you can ignore this offer',
      );
    }

    if (shift.status !== 'OFFERED' || shift.offeredWorkerId !== userId) {
      throw new BadRequestException('No pending offer for you on this shift');
    }

    // Decline leaves the shift published and visibly unfilled for rematch (OX-037).
    const updated = await this.prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: 'UNFILLED',
        offeredWorkerId: null,
        assignedWorkerId: null,
        isBroadcast: false,
      },
      include: this.shiftInclude,
    });

    void this.notifications.notifyUser(shift.createdById, organisationId, {
      type: 'WARNING',
      title: 'Shift offer declined',
      message: `The offer for the ${updated.serviceTitle} shift on ${this.formatDateOnly(updated.date)} was declined and needs rematching.`,
      link: '/schedule/matching',
    });

    return this.toShiftDto(updated);
  }

  // ─── Roster-derived participant care view (OX-012) ──────

  /**
   * Limited care summary for a participant the employee supports via roster.
   * Draft shifts never unlock this view.
   */
  async getMyParticipantCareView(
    organisationId: string,
    userId: string,
    role: string,
    customerId: string,
  ) {
    await this.assertViewMyShifts(organisationId, role);

    const relationship = await this.prisma.shift.findFirst({
      where: {
        organisationId,
        customerId,
        status: { in: [...CARE_VIEW_STATUSES] },
        OR: [
          { offeredWorkerId: userId, status: 'OFFERED' },
          { assignedWorkerId: userId, status: { in: ['ACCEPTED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED'] } },
        ],
      },
      orderBy: { date: 'desc' },
    });

    if (!relationship) {
      throw new ForbiddenException(
        'You do not have a roster relationship with this participant',
      );
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organisationId },
    });
    if (!customer) throw new NotFoundException('Participant not found');

    const relatedShifts = await this.prisma.shift.findMany({
      where: {
        organisationId,
        customerId,
        status: { in: [...CARE_VIEW_STATUSES] },
        OR: [
          { offeredWorkerId: userId },
          { assignedWorkerId: userId },
        ],
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
      take: 20,
    });

    return {
      customerId: customer.id,
      displayName: customer.preferredName
        ? `${customer.preferredName} ${customer.surname}`
        : `${customer.firstName} ${customer.surname}`,
      // Care-relevant fields only — no funding / org-wide / unnecessary PII.
      supportSummary: customer.supportSummary,
      planStartDate: customer.planStartDate
        ? this.formatDateOnly(customer.planStartDate)
        : null,
      planEndDate: customer.planEndDate
        ? this.formatDateOnly(customer.planEndDate)
        : null,
      // v1: use the customer phone field (dedicated emergency contact not collected yet).
      emergencyContactName: customer.emergencyContactName,
      emergencyContactPhone: customer.emergencyContactPhone ?? customer.phone,
      goals: customer.goals,
      risks: customer.risks,
      serviceLine: customer.serviceLine,
      shiftRelationships: relatedShifts.map((s) => ({
        shiftId: s.id,
        date: this.formatDateOnly(s.date),
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
        serviceTitle: s.serviceTitle,
      })),
    };
  }

  // ─── Employee availability (OX-029) ─────────────────────

  async getMyAvailability(organisationId: string, userId: string, role: string) {
    await this.assertManageMyAvailability(organisationId, role);

    const weekly = await this.prisma.workerAvailability.findMany({
      where: { userId, organisationId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Default empty week if nothing saved yet.
    const byDay = new Map(weekly.map((w) => [w.dayOfWeek, w]));
    const days = Array.from({ length: 7 }, (_, i) => {
      const dayOfWeek = i + 1;
      const row = byDay.get(dayOfWeek);
      return {
        dayOfWeek,
        enabled: row?.enabled ?? false,
        startTime: row?.startTime ?? '07:00',
        endTime: row?.endTime ?? '19:00',
      };
    });

    const exceptions = await this.prisma.availabilityException.findMany({
      where: { userId, organisationId },
      orderBy: { fromDate: 'asc' },
    });

    return {
      weekly: days,
      exceptions: exceptions.map((e) => ({
        id: e.id,
        fromDate: this.formatDateOnly(e.fromDate),
        toDate: this.formatDateOnly(e.toDate),
        reason: e.reason,
      })),
    };
  }

  async saveMyAvailability(
    organisationId: string,
    userId: string,
    role: string,
    dto: SaveAvailabilityDto,
  ) {
    await this.assertManageMyAvailability(organisationId, role);

    if (dto.weekly.length !== 7) {
      throw new BadRequestException('Provide all 7 weekdays');
    }

    for (const day of dto.weekly) {
      this.parseTimeToMinutes(day.startTime);
      this.parseTimeToMinutes(day.endTime);
      if (
        day.enabled &&
        this.parseTimeToMinutes(day.startTime) >= this.parseTimeToMinutes(day.endTime)
      ) {
        throw new BadRequestException(
          `Day ${day.dayOfWeek}: end time must be after start time`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      for (const day of dto.weekly) {
        await tx.workerAvailability.upsert({
          where: {
            userId_dayOfWeek: { userId, dayOfWeek: day.dayOfWeek },
          },
          create: {
            organisationId,
            userId,
            dayOfWeek: day.dayOfWeek,
            enabled: day.enabled,
            startTime: day.startTime,
            endTime: day.endTime,
          },
          update: {
            enabled: day.enabled,
            startTime: day.startTime,
            endTime: day.endTime,
          },
        });
      }

      // Replace all exceptions with the submitted set.
      await tx.availabilityException.deleteMany({ where: { userId } });
      if (dto.exceptions.length > 0) {
        await tx.availabilityException.createMany({
          data: dto.exceptions.map((e) => {
            const from = this.parseDateOnly(e.fromDate);
            const to = this.parseDateOnly(e.toDate);
            if (to < from) {
              throw new BadRequestException('Exception end must be on or after start');
            }
            return {
              organisationId,
              userId,
              fromDate: from,
              toDate: to,
              reason: e.reason?.trim() || '',
            };
          }),
        });
      }
    });

    return this.getMyAvailability(organisationId, userId, role);
  }

  // ─── Service-line task catalogues (v1) ───────────────────

  /**
   * Resolve labels for a service line: org catalogue if present, else built-in defaults.
   * Optionally seeds the org catalogue from defaults on first use.
   */
  private async resolveTaskLabels(
    organisationId: string,
    serviceLine: string,
  ): Promise<string[]> {
    const existing = await this.prisma.serviceLineTaskTemplate.findMany({
      where: { organisationId, serviceLine },
      orderBy: { sortOrder: 'asc' },
    });
    if (existing.length > 0) {
      return existing.map((t) => t.label);
    }

    const defaults = defaultTasksForServiceLine(serviceLine);
    await this.prisma.serviceLineTaskTemplate.createMany({
      data: defaults.map((label, index) => ({
        organisationId,
        serviceLine,
        label,
        sortOrder: index,
        required: true,
      })),
      skipDuplicates: true,
    });
    return defaults;
  }

  /** Copy the service-line checklist onto a newly created shift. */
  private async copyTasksOntoShift(
    organisationId: string,
    shiftId: string,
    serviceLine: string,
  ) {
    const labels = await this.resolveTaskLabels(organisationId, serviceLine);
    await this.prisma.shiftTask.createMany({
      data: labels.map((label, index) => ({
        shiftId,
        label,
        sortOrder: index,
        required: true,
      })),
    });
  }

  async listServiceLineTaskCatalogues(organisationId: string, role: string) {
    this.assertOrgAdmin(role);

    const rows = await this.prisma.serviceLineTaskTemplate.findMany({
      where: { organisationId },
      orderBy: [{ serviceLine: 'asc' }, { sortOrder: 'asc' }],
    });

    const byLine = new Map<string, string[]>();
    for (const row of rows) {
      const list = byLine.get(row.serviceLine) ?? [];
      list.push(row.label);
      byLine.set(row.serviceLine, list);
    }

    // Include known default lines so the UI can show empty catalogues.
    for (const line of Object.keys(DEFAULT_SERVICE_LINE_TASKS)) {
      if (!byLine.has(line)) byLine.set(line, [...DEFAULT_SERVICE_LINE_TASKS[line]]);
    }

    return Array.from(byLine.entries()).map(([serviceLine, labels]) => ({
      serviceLine,
      labels,
    }));
  }

  async saveServiceLineTasks(
    organisationId: string,
    role: string,
    dto: SaveServiceLineTasksDto,
  ) {
    this.assertOrgAdmin(role);
    const serviceLine = dto.serviceLine.trim();
    const labels = dto.labels.map((l) => l.trim()).filter(Boolean);
    if (labels.length === 0) {
      throw new BadRequestException('Add at least one task label');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.serviceLineTaskTemplate.deleteMany({
        where: { organisationId, serviceLine },
      });
      await tx.serviceLineTaskTemplate.createMany({
        data: labels.map((label, index) => ({
          organisationId,
          serviceLine,
          label,
          sortOrder: index,
          required: true,
        })),
      });
    });

    return this.listServiceLineTaskCatalogues(organisationId, role);
  }

  // ─── Phase B: start / tasks / note / finish ─────────────

  private async orgTimeZone(organisationId: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { timezone: true },
    });
    return org?.timezone || 'UTC';
  }

  /** Calendar YYYY-MM-DD for a Prisma @db.Date (always UTC midnight). */
  private calendarDateKey(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /** Combine shift calendar date + HH:mm in the organisation timezone. */
  private async scheduledDateTime(
    organisationId: string,
    date: Date,
    time: string,
  ): Promise<Date> {
    const timeZone = await this.orgTimeZone(organisationId);
    return zonedWallTimeToUtc(this.calendarDateKey(date), time, timeZone);
  }

  private minutesBetween(a: Date, b: Date): number {
    return Math.round((b.getTime() - a.getTime()) / 60000);
  }

  async startMyShift(
    organisationId: string,
    userId: string,
    role: string,
    shiftId: string,
  ) {
    await this.assertExecuteMyShifts(organisationId, role);
    const shift = await this.findOrgShift(organisationId, shiftId);

    if (shift.assignedWorkerId !== userId || shift.status !== 'ACCEPTED') {
      throw new BadRequestException('Only an accepted assigned worker can start this shift');
    }

    const now = new Date();
    const scheduledStart = await this.scheduledDateTime(
      organisationId,
      shift.date,
      shift.startTime,
    );
    const minutesUntilStart = this.minutesBetween(now, scheduledStart);

    // More than 30 minutes before scheduled start → hard block (datetime, not date-only).
    if (minutesUntilStart > EARLY_START_ALLOW_MINUTES) {
      throw new BadRequestException(
        `You can start this shift from ${EARLY_START_ALLOW_MINUTES} minutes before the scheduled start (${shift.startTime}). Come back closer to the start time.`,
      );
    }

    const updated = await this.prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: 'IN_PROGRESS',
        actualStartedAt: now,
      },
      include: this.shiftInclude,
    });
    return this.toShiftDto(updated);
  }

  async completeMyTask(
    organisationId: string,
    userId: string,
    role: string,
    shiftId: string,
    taskId: string,
  ) {
    await this.assertExecuteMyShifts(organisationId, role);
    const shift = await this.findOrgShift(organisationId, shiftId);

    if (shift.assignedWorkerId !== userId) {
      throw new ForbiddenException('Not your shift');
    }
    // Server-side pre-start protection (OX-038).
    if (shift.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Tasks can only be completed after the shift has started');
    }

    const task = await this.prisma.shiftTask.findFirst({
      where: { id: taskId, shiftId: shift.id },
    });
    if (!task) throw new NotFoundException('Task not found');
    if (task.completedAt) {
      return this.toShiftDto(await this.findOrgShift(organisationId, shiftId));
    }

    await this.prisma.shiftTask.update({
      where: { id: task.id },
      data: { completedAt: new Date() },
    });
    return this.toShiftDto(await this.findOrgShift(organisationId, shiftId));
  }

  async saveMyProgressNote(
    organisationId: string,
    userId: string,
    role: string,
    shiftId: string,
    dto: SaveProgressNoteDto,
  ) {
    await this.assertExecuteMyShifts(organisationId, role);
    const shift = await this.findOrgShift(organisationId, shiftId);

    if (shift.assignedWorkerId !== userId) {
      throw new ForbiddenException('Not your shift');
    }
    if (shift.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Progress notes can only be edited while the shift is in progress');
    }

    const updated = await this.prisma.shift.update({
      where: { id: shift.id },
      data: { progressNote: dto.progressNote.trim() },
      include: this.shiftInclude,
    });
    return this.toShiftDto(updated);
  }

  /**
   * Finish the shift.
   * Auto-approve when:
   *  - start within 30 min early … 15 min late of scheduled start, and
   *  - end within min(30, half duration) early … 15 min late of scheduled end.
   * Otherwise finishReason required → PENDING_APPROVAL for Org Admin.
   */
  async finishMyShift(
    organisationId: string,
    userId: string,
    role: string,
    shiftId: string,
    finishReason?: string,
  ) {
    await this.assertExecuteMyShifts(organisationId, role);
    const shift = await this.findOrgShift(organisationId, shiftId);

    if (shift.assignedWorkerId !== userId || shift.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Only an in-progress assigned worker can finish this shift');
    }
    if (!shift.actualStartedAt) {
      throw new BadRequestException('Shift has no start time');
    }

    const incomplete = (shift.tasks ?? []).filter((t) => t.required && !t.completedAt);
    if (incomplete.length > 0) {
      throw new BadRequestException(
        `Complete all required tasks before finishing (${incomplete.length} remaining)`,
      );
    }

    const now = new Date();
    const scheduledStart = await this.scheduledDateTime(
      organisationId,
      shift.date,
      shift.startTime,
    );
    let scheduledEnd = await this.scheduledDateTime(
      organisationId,
      shift.date,
      shift.endTime,
    );
    // Overnight shifts store endTime on the next calendar day (e.g. 22:00 → 02:00).
    if (scheduledEnd.getTime() <= scheduledStart.getTime()) {
      scheduledEnd = new Date(scheduledEnd.getTime() + 24 * 60 * 60 * 1000);
    }

    // Positive = late/after scheduled; negative = early/before scheduled.
    const startVarianceMinutes = this.minutesBetween(scheduledStart, shift.actualStartedAt);
    const endVarianceMinutes = this.minutesBetween(scheduledEnd, now);
    const earlyEndAllow = earlyEndAllowMinutes(shift.durationMinutes);

    const outsideMargin = needsFinishApproval(
      startVarianceMinutes,
      endVarianceMinutes,
      shift.durationMinutes,
    );

    if (outsideMargin && !finishReason?.trim()) {
      throw new BadRequestException(
        `A reason is required when you start more than ${LATE_START_APPROVAL_MINUTES} minutes late, finish more than ${earlyEndAllow} minutes early, or finish more than ${LATE_END_ALLOW_MINUTES} minutes after the scheduled end`,
      );
    }

    const updated = await this.prisma.shift.update({
      where: { id: shift.id },
      data: {
        actualEndedAt: now,
        startVarianceMinutes,
        endVarianceMinutes,
        finishReason: outsideMargin ? finishReason!.trim() : null,
        status: outsideMargin ? 'PENDING_APPROVAL' : 'APPROVED',
        reviewedAt: outsideMargin ? null : now,
        reviewedById: null,
        reviewNote: outsideMargin
          ? null
          : 'Auto-approved: within allowed start/end time windows',
      },
      include: this.shiftInclude,
    });

    if (outsideMargin) {
      void this.notifications.notifyRole(organisationId, 'MANAGER', {
        type: 'WARNING',
        title: 'Shift needs approval',
        message: `${updated.assignedWorker?.firstName ?? 'A worker'}'s ${updated.serviceTitle} shift finished outside the allowed time windows and needs approval.`,
        link: '/shift-approvals',
      });
    }

    return this.toShiftDto(updated);
  }

  // ─── Manager approval queue (out-of-window finishes) ────

  async listPendingApprovals(organisationId: string, role: string) {
    await this.assertApproveServiceDelivery(organisationId, role);
    const shifts = await this.prisma.shift.findMany({
      where: { organisationId, status: 'PENDING_APPROVAL' },
      include: this.shiftInclude,
      orderBy: [{ actualEndedAt: 'asc' }],
    });
    return shifts.map((s) => this.toShiftDto(s));
  }

  async approveShift(
    organisationId: string,
    actorId: string,
    role: string,
    shiftId: string,
    reviewNote?: string,
  ) {
    await this.assertApproveServiceDelivery(organisationId, role);
    const shift = await this.findOrgShift(organisationId, shiftId);
    if (shift.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Shift is not awaiting approval');
    }

    const updated = await this.prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: 'APPROVED',
        reviewedById: actorId,
        reviewedAt: new Date(),
        reviewNote: reviewNote?.trim() || 'Approved by Manager',
      },
      include: this.shiftInclude,
    });

    if (updated.assignedWorkerId) {
      void this.notifications.notifyUser(updated.assignedWorkerId, organisationId, {
        type: 'SUCCESS',
        title: 'Shift approved',
        message: `Your ${updated.serviceTitle} shift on ${this.formatDateOnly(updated.date)} was approved.`,
        link: `/my-shifts/${updated.id}`,
      });
    }

    return this.toShiftDto(updated);
  }

  async rejectShift(
    organisationId: string,
    actorId: string,
    role: string,
    shiftId: string,
    reviewNote?: string,
  ) {
    await this.assertApproveServiceDelivery(organisationId, role);
    const shift = await this.findOrgShift(organisationId, shiftId);
    if (shift.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Shift is not awaiting approval');
    }
    if (!reviewNote?.trim()) {
      throw new BadRequestException('A review note is required when rejecting');
    }

    const updated = await this.prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: 'REJECTED',
        reviewedById: actorId,
        reviewedAt: new Date(),
        reviewNote: reviewNote.trim(),
      },
      include: this.shiftInclude,
    });

    if (updated.assignedWorkerId) {
      void this.notifications.notifyUser(updated.assignedWorkerId, organisationId, {
        type: 'ERROR',
        title: 'Shift rejected',
        message: `Your ${updated.serviceTitle} shift on ${this.formatDateOnly(updated.date)} was rejected: ${reviewNote.trim()}`,
        link: `/my-shifts/${updated.id}`,
      });
    }

    return this.toShiftDto(updated);
  }

  /**
   * Rostering Expert home — always reachable when Dashboard can open.
   * Soft-gates schedule sections by module + SCHEDULE page permission
   * (does not 403 when Schedule page access is off).
   */
  async getRosterOverview(organisationId: string, role: string) {
    const now = new Date();

    const [org, moduleRows, hasSchedulePage] = await Promise.all([
      this.prisma.organisation.findUnique({
        where: { id: organisationId },
        select: { name: true, timezone: true },
      }),
      this.organisations.listOrgModules(organisationId),
      this.permissions.hasPage(organisationId, role, 'SCHEDULE'),
    ]);

    if (!org) throw new NotFoundException('Organisation not found');

    const scheduleEnabled =
      hasSchedulePage &&
      moduleRows.some((m) => m.code === 'SCHEDULE' && m.enabled);

    const emptyFunnel = {
      DRAFT: 0,
      UNFILLED: 0,
      OFFERED: 0,
      ACCEPTED: 0,
      IN_PROGRESS_OR_DONE: 0,
    };
    const emptyTodayMix = {
      DRAFT: 0,
      UNFILLED: 0,
      OFFERED: 0,
      COVERED: 0,
    };

    const timezone = org.timezone || 'UTC';
    const todayKey = dateKeyInTimeZone(now, timezone);
    const weekEndKey = addDaysIso(todayKey, 6);
    const sparkStartKey = addDaysIso(todayKey, -13);
    const urgentCutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const sparkCounts = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      sparkCounts.set(addDaysIso(sparkStartKey, i), 0);
    }

    const weekLoad: Array<{ date: string; filled: number; open: number }> = [];
    for (let i = 0; i < 7; i++) {
      weekLoad.push({ date: addDaysIso(todayKey, i), filled: 0, open: 0 });
    }
    const weekLoadByDate = new Map(weekLoad.map((row) => [row.date, row]));

    if (!scheduleEnabled) {
      return {
        organisation: { name: org.name },
        modules: { scheduleEnabled },
        today: todayKey,
        kpis: {
          shiftsToday: 0,
          coveredToday: 0,
          awaitingAction: 0,
          coverageFilled: 0,
          coverageTotal: 0,
        },
        shiftsCreatedLast14Days: [...sparkCounts.entries()].map(
          ([date, count]) => ({ date, count }),
        ),
        attention: {
          drafts: [],
          unfilled: [],
          offersPending: [],
          urgentOpen: [],
        },
        coverageFunnelNext7Days: emptyFunnel,
        todayStatusMix: emptyTodayMix,
        weekLoad,
      };
    }

    const shifts = await this.prisma.shift.findMany({
      where: {
        organisationId,
        OR: [
          {
            date: {
              gte: this.parseDateOnly(todayKey),
              lte: this.parseDateOnly(weekEndKey),
            },
            status: { notIn: ['CANCELLED'] },
          },
          {
            createdAt: {
              gte: this.parseDateOnly(sparkStartKey),
            },
          },
        ],
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        participantName: true,
        serviceTitle: true,
        locationLabel: true,
        status: true,
        createdAt: true,
        offeredWorker: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    const coverageFunnelNext7Days = { ...emptyFunnel };
    const todayStatusMix = { ...emptyTodayMix };
    let shiftsToday = 0;
    let coveredToday = 0;
    let coverageFilled = 0;
    let coverageTotal = 0;

    type AttentionItem = {
      shiftId: string;
      date: string;
      startTime: string;
      participantName: string;
      serviceTitle: string;
      locationLabel: string;
      offeredWorkerName?: string | null;
      startsAt?: string;
    };

    const drafts: AttentionItem[] = [];
    const unfilled: AttentionItem[] = [];
    const offersPending: AttentionItem[] = [];
    const urgentOpen: AttentionItem[] = [];
    const seenUrgent = new Set<string>();

    for (const shift of shifts) {
      const dateKey = this.formatDateOnly(shift.date);
      const createdKey = this.formatDateOnly(shift.createdAt);
      if (sparkCounts.has(createdKey)) {
        sparkCounts.set(createdKey, (sparkCounts.get(createdKey) ?? 0) + 1);
      }

      const inWeek =
        dateKey >= todayKey &&
        dateKey <= weekEndKey &&
        shift.status !== 'CANCELLED' &&
        shift.status !== 'REJECTED';

      if (!inWeek && dateKey !== todayKey) continue;

      if (inWeek) {
        coverageTotal += 1;
        if (COVERED_STATUSES.has(shift.status)) coverageFilled += 1;

        if (shift.status === 'DRAFT') coverageFunnelNext7Days.DRAFT += 1;
        else if (shift.status === 'UNFILLED') coverageFunnelNext7Days.UNFILLED += 1;
        else if (shift.status === 'OFFERED') coverageFunnelNext7Days.OFFERED += 1;
        else if (shift.status === 'ACCEPTED') coverageFunnelNext7Days.ACCEPTED += 1;
        else if (DONE_BUCKET_STATUSES.has(shift.status)) {
          coverageFunnelNext7Days.IN_PROGRESS_OR_DONE += 1;
        }

        const load = weekLoadByDate.get(dateKey);
        if (load) {
          if (COVERED_STATUSES.has(shift.status)) load.filled += 1;
          else if (OPEN_ACTION_STATUSES.has(shift.status)) load.open += 1;
        }
      }

      if (dateKey === todayKey && shift.status !== 'CANCELLED' && shift.status !== 'REJECTED') {
        shiftsToday += 1;
        if (COVERED_STATUSES.has(shift.status)) {
          coveredToday += 1;
          todayStatusMix.COVERED += 1;
        } else if (shift.status === 'DRAFT') todayStatusMix.DRAFT += 1;
        else if (shift.status === 'UNFILLED') todayStatusMix.UNFILLED += 1;
        else if (shift.status === 'OFFERED') todayStatusMix.OFFERED += 1;
      }

      if (inWeek && OPEN_ACTION_STATUSES.has(shift.status)) {
        const item: AttentionItem = {
          shiftId: shift.id,
          date: dateKey,
          startTime: shift.startTime,
          participantName: shift.participantName,
          serviceTitle: shift.serviceTitle,
          locationLabel: shift.locationLabel,
          offeredWorkerName: this.workerName(shift.offeredWorker),
        };

        if (shift.status === 'DRAFT' && drafts.length < 5) drafts.push(item);
        if (shift.status === 'UNFILLED' && unfilled.length < 5) unfilled.push(item);
        if (shift.status === 'OFFERED' && offersPending.length < 5) {
          offersPending.push(item);
        }

        // Urgent: starts within 24h and still open.
        const startAt = new Date(`${dateKey}T${shift.startTime}:00`);
        if (
          !Number.isNaN(startAt.getTime()) &&
          startAt >= now &&
          startAt <= urgentCutoff &&
          !seenUrgent.has(shift.id) &&
          urgentOpen.length < 5
        ) {
          seenUrgent.add(shift.id);
          urgentOpen.push({ ...item, startsAt: startAt.toISOString() });
        }
      }
    }

    const awaitingAction =
      coverageFunnelNext7Days.DRAFT +
      coverageFunnelNext7Days.UNFILLED +
      coverageFunnelNext7Days.OFFERED;

    return {
      organisation: { name: org.name },
      modules: { scheduleEnabled },
      today: todayKey,
      kpis: {
        shiftsToday,
        coveredToday,
        awaitingAction,
        coverageFilled,
        coverageTotal,
      },
      shiftsCreatedLast14Days: [...sparkCounts.entries()].map(([date, count]) => ({
        date,
        count,
      })),
      attention: {
        drafts,
        unfilled,
        offersPending,
        urgentOpen,
      },
      coverageFunnelNext7Days,
      todayStatusMix,
      weekLoad,
    };
  }

  /**
   * Personal home dashboard — offers, shifts, availability for the signed-in user.
   * Soft-gates SCHEDULE / SERVICE_DELIVERY modules.
   */
  async getEmployeeOverview(
    organisationId: string,
    userId: string,
    role: string,
  ) {
    await this.permissions.assertAnyAction(organisationId, role, [
      'VIEW_MY_SHIFTS',
      'VIEW_MY_TIMESHEETS',
      'MANAGE_MY_AVAILABILITY',
      'EXECUTE_MY_SHIFTS',
    ]);

    const now = new Date();

    const [org, moduleRows] = await Promise.all([
      this.prisma.organisation.findUnique({
        where: { id: organisationId },
        select: { name: true, timezone: true },
      }),
      this.organisations.listOrgModules(organisationId),
    ]);

    if (!org) throw new NotFoundException('Organisation not found');

    const scheduleEnabled = moduleRows.some(
      (m) => m.code === 'SCHEDULE' && m.enabled,
    );
    const serviceDeliveryEnabled = moduleRows.some(
      (m) => m.code === 'SERVICE_DELIVERY' && m.enabled,
    );

    const timezone = org.timezone || 'UTC';
    const todayKey = dateKeyInTimeZone(now, timezone);
    const weekEndKey = addDaysIso(todayKey, 6);

    const emptyStatusMix = {
      OFFERED: 0,
      ACCEPTED: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };

    const weekLoad: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < 7; i++) {
      weekLoad.push({ date: addDaysIso(todayKey, i), count: 0 });
    }
    const weekLoadByDate = new Map(weekLoad.map((row) => [row.date, row]));

    const availabilityNext7Days: Array<{
      date: string;
      level: 'FULL' | 'UNAVAILABLE' | null;
    }> = weekLoad.map((row) => ({ date: row.date, level: null }));

    if (!scheduleEnabled) {
      return {
        organisation: { name: org.name },
        modules: { scheduleEnabled, serviceDeliveryEnabled },
        today: todayKey,
        kpis: {
          shiftsToday: 0,
          inProgressToday: 0,
          awaitingMe: 0,
          weekShiftCount: 0,
        },
        attention: {
          offers: [],
          inProgress: [],
          readyToStartToday: [],
          nextShift: null,
        },
        weekLoad,
        myStatusMix: emptyStatusMix,
        availabilityNext7Days,
      };
    }

    const [shifts, weeklyAvail, exceptions] = await Promise.all([
      this.prisma.shift.findMany({
        where: {
          organisationId,
          OR: [
            { offeredWorkerId: userId, status: 'OFFERED' },
            { isBroadcast: true, status: 'OFFERED' },
            { assignedWorkerId: userId },
          ],
        },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          participantName: true,
          serviceTitle: true,
          locationLabel: true,
          status: true,
          offeredWorkerId: true,
          assignedWorkerId: true,
          isBroadcast: true,
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      }),
      this.prisma.workerAvailability.findMany({
        where: { userId, organisationId },
        select: { dayOfWeek: true, enabled: true },
      }),
      this.prisma.availabilityException.findMany({
        where: { userId, organisationId },
        select: { fromDate: true, toDate: true },
      }),
    ]);

    const visible = shifts.filter((s) =>
      PUBLISHED_STATUSES.includes(s.status as (typeof PUBLISHED_STATUSES)[number]),
    );

    type ShiftAttention = {
      shiftId: string;
      date: string;
      startTime: string;
      endTime: string;
      participantName: string;
      serviceTitle: string;
      locationLabel: string;
      status: string;
    };

    const offers: ShiftAttention[] = [];
    const inProgress: ShiftAttention[] = [];
    const readyToStartToday: ShiftAttention[] = [];
    const myStatusMix = { ...emptyStatusMix };
    let shiftsToday = 0;
    let inProgressToday = 0;
    let weekShiftCount = 0;
    let nextShift: ShiftAttention | null = null;

    const toItem = (s: (typeof visible)[number]): ShiftAttention => ({
      shiftId: s.id,
      date: this.formatDateOnly(s.date),
      startTime: s.startTime,
      endTime: s.endTime,
      participantName: s.participantName,
      serviceTitle: s.serviceTitle,
      locationLabel: s.locationLabel,
      status: s.status,
    });

    for (const shift of visible) {
      const dateKey = this.formatDateOnly(shift.date);
      const inWeek = dateKey >= todayKey && dateKey <= weekEndKey;
      const isMineAssigned = shift.assignedWorkerId === userId;
      const isOffer =
        shift.status === 'OFFERED' &&
        (shift.offeredWorkerId === userId ||
          (Boolean(shift.isBroadcast) && !shift.offeredWorkerId));

      if (isOffer) {
        myStatusMix.OFFERED += 1;
        if (offers.length < 8) offers.push(toItem(shift));
      }

      if (isMineAssigned) {
        if (shift.status === 'ACCEPTED') myStatusMix.ACCEPTED += 1;
        else if (shift.status === 'IN_PROGRESS') myStatusMix.IN_PROGRESS += 1;
        else if (
          shift.status === 'APPROVED' ||
          shift.status === 'PENDING_APPROVAL'
        ) {
          myStatusMix.DONE += 1;
        }

        if (inWeek && COVERED_STATUSES.has(shift.status)) {
          weekShiftCount += 1;
          const load = weekLoadByDate.get(dateKey);
          if (load) load.count += 1;
        }

        if (
          dateKey === todayKey &&
          COVERED_STATUSES.has(shift.status)
        ) {
          shiftsToday += 1;
          if (shift.status === 'IN_PROGRESS') inProgressToday += 1;
        }

        if (shift.status === 'IN_PROGRESS' && inProgress.length < 5) {
          inProgress.push(toItem(shift));
        }

        if (
          serviceDeliveryEnabled &&
          shift.status === 'ACCEPTED' &&
          dateKey === todayKey &&
          readyToStartToday.length < 5
        ) {
          readyToStartToday.push(toItem(shift));
        }

        // Next upcoming assigned shift (not yet approved/done terminal for "next work")
        if (
          !nextShift &&
          dateKey >= todayKey &&
          (shift.status === 'ACCEPTED' ||
            shift.status === 'IN_PROGRESS' ||
            shift.status === 'PENDING_APPROVAL')
        ) {
          nextShift = toItem(shift);
        }
      }
    }

    // Prefer in-progress as nextShift when present.
    if (inProgress[0]) nextShift = inProgress[0];

    const awaitingMe =
      myStatusMix.OFFERED +
      (serviceDeliveryEnabled ? readyToStartToday.length : 0) +
      inProgress.length;

    // Availability snapshot for next 7 days.
    const weeklyByDay = new Map(
      weeklyAvail.map((w) => [w.dayOfWeek, w.enabled]),
    );
    const hasAnyWeekly = weeklyAvail.length > 0;

    for (const row of availabilityNext7Days) {
      const d = new Date(`${row.date}T12:00:00.000Z`);
      const jsDay = d.getUTCDay();
      const dayOfWeek = jsDay === 0 ? 7 : jsDay;
      const dateVal = this.parseDateOnly(row.date);

      const onException = exceptions.some(
        (e) => e.fromDate <= dateVal && e.toDate >= dateVal,
      );
      if (onException) {
        row.level = 'UNAVAILABLE';
        continue;
      }
      if (!hasAnyWeekly) {
        row.level = null;
        continue;
      }
      row.level = weeklyByDay.get(dayOfWeek) ? 'FULL' : 'UNAVAILABLE';
    }

    return {
      organisation: { name: org.name },
      modules: { scheduleEnabled, serviceDeliveryEnabled },
      today: todayKey,
      kpis: {
        shiftsToday,
        inProgressToday,
        awaitingMe,
        weekShiftCount,
      },
      attention: {
        offers,
        inProgress,
        readyToStartToday,
        nextShift,
      },
      weekLoad,
      myStatusMix,
      availabilityNext7Days,
    };
  }
}
