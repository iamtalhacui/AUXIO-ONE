import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
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

/** ±15 minutes — inside this band finish is auto-approved. */
export const VARIANCE_MARGIN_MINUTES = 15;

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
  ) {}

  // ─── Role helpers ───────────────────────────────────────

  private assertRosteringExpert(role: string) {
    if (role !== 'ROSTERING_EXPERT') {
      throw new ForbiddenException(
        'Only Rostering Experts can manage the schedule',
      );
    }
  }

  private assertEmployee(role: string) {
    if (role !== 'EMPLOYEE') {
      throw new ForbiddenException('Only employees can access this resource');
    }
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
    return d.toISOString().slice(0, 10);
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
    this.assertRosteringExpert(role);

    const rows = await this.prisma.customer.findMany({
      where: {
        organisationId,
        status: { in: ['ACTIVE', 'ONBOARDING'] },
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

  /** Active verified employees available for matching. */
  async listWorkers(organisationId: string, role: string) {
    this.assertRosteringExpert(role);

    const workers = await this.prisma.user.findMany({
      where: {
        organisationId,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        onboardingStatus: 'VERIFIED',
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        onboardingStatus: true,
        weeklyAvailability: true,
      },
    });

    return workers.map((w) => ({
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
    this.assertRosteringExpert(role);

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
    this.assertRosteringExpert(role);
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
  previewRecurrence(organisationId: string, role: string, dto: PreviewRecurrenceDto) {
    this.assertRosteringExpert(role);
    void organisationId;
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
    this.assertRosteringExpert(role);
    this.validateCreateInput(dto);

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
    this.assertRosteringExpert(role);
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
    this.assertRosteringExpert(role);
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

  /** Publish without a worker — appears as unfilled on the operational roster. */
  async publishUnfilled(organisationId: string, role: string, shiftId: string) {
    this.assertRosteringExpert(role);
    const shift = await this.findOrgShift(organisationId, shiftId);
    if (shift.status !== 'DRAFT' && shift.status !== 'UNFILLED') {
      throw new BadRequestException('Only draft or unfilled shifts can be published empty');
    }
    const updated = await this.prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: 'UNFILLED',
        publishedAt: shift.publishedAt ?? new Date(),
        offeredWorkerId: null,
        assignedWorkerId: null,
      },
      include: this.shiftInclude,
    });
    return this.toShiftDto(updated);
  }

  /**
   * Publish (if needed) and offer the shift to one eligible worker.
   * No tentative draft assignment — offer happens only at this step.
   */
  async publishAndOffer(
    organisationId: string,
    role: string,
    shiftId: string,
    workerId: string,
  ) {
    this.assertRosteringExpert(role);
    const shift = await this.findOrgShift(organisationId, shiftId);

    if (!['DRAFT', 'UNFILLED', 'OFFERED'].includes(shift.status)) {
      throw new BadRequestException('This shift cannot be offered in its current status');
    }
    if (shift.status === 'OFFERED' && shift.offeredWorkerId) {
      throw new BadRequestException(
        'An offer is already pending — wait for accept/decline or cancel the offer first',
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
        status: 'OFFERED',
        offeredWorkerId: workerId,
        assignedWorkerId: null,
        publishedAt: shift.publishedAt ?? new Date(),
      },
      include: this.shiftInclude,
    });

    void this.notifications.notifyUser(workerId, organisationId, {
      type: 'INFO',
      title: 'New shift offer',
      message: `You've been offered a ${updated.serviceTitle} shift on ${this.formatDateOnly(updated.date)} (${updated.startTime}–${updated.endTime}).`,
      link: `/employee/shifts/${updated.id}`,
    });

    return this.toShiftDto(updated);
  }

  /** Withdraw a pending offer and leave the shift published but unfilled. */
  async withdrawOffer(organisationId: string, role: string, shiftId: string) {
    this.assertRosteringExpert(role);
    const shift = await this.findOrgShift(organisationId, shiftId);
    if (shift.status !== 'OFFERED') {
      throw new BadRequestException('Shift does not have a pending offer');
    }
    const updated = await this.prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: 'UNFILLED',
        offeredWorkerId: null,
      },
      include: this.shiftInclude,
    });
    return this.toShiftDto(updated);
  }

  /** Rank employees for a draft/unfilled/offered shift (hard rules only). */
  async listCandidates(organisationId: string, role: string, shiftId: string) {
    this.assertRosteringExpert(role);
    const shift = await this.findOrgShift(organisationId, shiftId);

    if (!['DRAFT', 'UNFILLED', 'OFFERED'].includes(shift.status)) {
      return [];
    }

    const workers = await this.prisma.user.findMany({
      where: {
        organisationId,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        onboardingStatus: true,
      },
    });

    // Collect matching scores for every active employee (hard rules only).
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
      where: { id: workerId, organisationId, role: 'EMPLOYEE' },
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
    const complianceOk = worker.onboardingStatus === 'VERIFIED';
    if (!complianceOk) blockers.push('Not ready / onboarding incomplete');

    const availability = await this.getAvailabilityForShift(workerId, shift);
    if (availability === 'UNAVAILABLE') blockers.push('Unavailable');
    if (availability === 'PARTIAL') blockers.push('Only partially available');

    const hasConflict = await this.workerHasConflict(organisationId, workerId, shift);
    if (hasConflict) blockers.push('Scheduling conflict');

    // Fully ready = verified + fully available + no conflict.
    // Partial availability must never look fully ready (OX-032).
    const eligible =
      complianceOk && availability === 'FULL' && !hasConflict;

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
    this.assertEmployee(role);

    const shifts = await this.prisma.shift.findMany({
      where: {
        organisationId,
        OR: [
          { offeredWorkerId: userId, status: 'OFFERED' },
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
    this.assertEmployee(role);
    const shift = await this.prisma.shift.findFirst({
      where: {
        id: shiftId,
        organisationId,
        OR: [
          { offeredWorkerId: userId, status: 'OFFERED' },
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
    this.assertEmployee(role);
    const shift = await this.findOrgShift(organisationId, shiftId);

    if (shift.status !== 'OFFERED' || shift.offeredWorkerId !== userId) {
      throw new BadRequestException('No pending offer for you on this shift');
    }

    const conflict = await this.workerHasConflict(organisationId, userId, shift);
    if (conflict) {
      throw new BadRequestException('Cannot accept — you have a scheduling conflict');
    }

    const updated = await this.prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: 'ACCEPTED',
        assignedWorkerId: userId,
        offeredWorkerId: null,
      },
      include: this.shiftInclude,
    });

    void this.notifications.notifyUser(shift.createdById, organisationId, {
      type: 'SUCCESS',
      title: 'Shift offer accepted',
      message: `${updated.assignedWorker?.firstName ?? 'A worker'} accepted the ${updated.serviceTitle} shift on ${this.formatDateOnly(updated.date)}.`,
      link: '/roster/schedule',
    });

    return this.toShiftDto(updated);
  }

  async declineOffer(
    organisationId: string,
    userId: string,
    role: string,
    shiftId: string,
  ) {
    this.assertEmployee(role);
    const shift = await this.findOrgShift(organisationId, shiftId);

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
      },
      include: this.shiftInclude,
    });

    void this.notifications.notifyUser(shift.createdById, organisationId, {
      type: 'WARNING',
      title: 'Shift offer declined',
      message: `The offer for the ${updated.serviceTitle} shift on ${this.formatDateOnly(updated.date)} was declined and needs rematching.`,
      link: '/roster/matching',
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
    this.assertEmployee(role);

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
    this.assertEmployee(role);

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
    this.assertEmployee(role);

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

  /** Combine shift date + HH:mm into a Date (UTC wall-clock, same as Phase A). */
  private scheduledDateTime(date: Date, time: string): Date {
    const [h, m] = time.split(':').map(Number);
    const d = new Date(date);
    d.setUTCHours(h, m, 0, 0);
    return d;
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
    this.assertEmployee(role);
    const shift = await this.findOrgShift(organisationId, shiftId);

    if (shift.assignedWorkerId !== userId || shift.status !== 'ACCEPTED') {
      throw new BadRequestException('Only an accepted assigned worker can start this shift');
    }

    const updated = await this.prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: 'IN_PROGRESS',
        actualStartedAt: new Date(),
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
    this.assertEmployee(role);
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
    this.assertEmployee(role);
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
   * Within ±15 min on start AND end → APPROVED automatically.
   * Outside margin → finishReason required → PENDING_APPROVAL for Org Admin.
   */
  async finishMyShift(
    organisationId: string,
    userId: string,
    role: string,
    shiftId: string,
    finishReason?: string,
  ) {
    this.assertEmployee(role);
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
    const scheduledStart = this.scheduledDateTime(shift.date, shift.startTime);
    const scheduledEnd = this.scheduledDateTime(shift.date, shift.endTime);

    // Positive = late/after scheduled; negative = early/before scheduled.
    const startVarianceMinutes = this.minutesBetween(scheduledStart, shift.actualStartedAt);
    const endVarianceMinutes = this.minutesBetween(scheduledEnd, now);

    const outsideMargin =
      Math.abs(startVarianceMinutes) > VARIANCE_MARGIN_MINUTES ||
      Math.abs(endVarianceMinutes) > VARIANCE_MARGIN_MINUTES;

    if (outsideMargin && !finishReason?.trim()) {
      throw new BadRequestException(
        `A reason is required when start or end time is more than ${VARIANCE_MARGIN_MINUTES} minutes early or late`,
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
        // Auto-approve records approval timestamp without an Org Admin actor.
        reviewedAt: outsideMargin ? null : now,
        reviewedById: null,
        reviewNote: outsideMargin
          ? null
          : 'Auto-approved: within ±15 minute margin',
      },
      include: this.shiftInclude,
    });

    if (outsideMargin) {
      void this.notifications.notifyRole(organisationId, 'ORG_ADMIN', {
        type: 'WARNING',
        title: 'Shift needs approval',
        message: `${updated.assignedWorker?.firstName ?? 'A worker'}'s ${updated.serviceTitle} shift finished outside the ±15 minute margin and needs approval.`,
        link: '/org-admin/shift-approvals',
      });
    }

    return this.toShiftDto(updated);
  }

  // ─── Org Admin approval queue ───────────────────────────

  async listPendingApprovals(organisationId: string, role: string) {
    this.assertOrgAdmin(role);
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
    this.assertOrgAdmin(role);
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
        reviewNote: reviewNote?.trim() || 'Approved by Org Admin',
      },
      include: this.shiftInclude,
    });

    if (updated.assignedWorkerId) {
      void this.notifications.notifyUser(updated.assignedWorkerId, organisationId, {
        type: 'SUCCESS',
        title: 'Shift approved',
        message: `Your ${updated.serviceTitle} shift on ${this.formatDateOnly(updated.date)} was approved.`,
        link: `/employee/shifts/${updated.id}`,
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
    this.assertOrgAdmin(role);
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
        link: `/employee/shifts/${updated.id}`,
      });
    }

    return this.toShiftDto(updated);
  }
}
