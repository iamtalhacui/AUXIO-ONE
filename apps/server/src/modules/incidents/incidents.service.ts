import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { readFileSync } from 'fs';
import type {
  Incident,
  IncidentAction,
  IncidentAttachment,
  IncidentHistory,
  IncidentReportabilityDecision,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  Prisma,
} from 'database';
import { MailService } from '../../common/mail/mail.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LocalFileStorageService } from '../../common/storage/local-file-storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionsService } from '../permissions/permissions.service';
import {
  CreateIncidentActionDto,
  CreateIncidentDto,
  ListIncidentsQueryDto,
  UpdateIncidentActionDto,
  UpdateIncidentDto,
} from './dto/incident.dto';

type MulterUpload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
};

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** Allowed status moves — not every step is required. */
const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  PENDING_REVIEW: ['UNDER_REVIEW', 'ACTION_REQUIRED', 'RESOLVED', 'CLOSED'],
  UNDER_REVIEW: ['ACTION_REQUIRED', 'RESOLVED', 'CLOSED', 'PENDING_REVIEW'],
  ACTION_REQUIRED: ['UNDER_REVIEW', 'RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED', 'ACTION_REQUIRED', 'UNDER_REVIEW'],
  CLOSED: ['UNDER_REVIEW'],
};

const incidentInclude = {
  reporter: { select: { id: true, firstName: true, lastName: true } },
  customer: { select: { id: true, firstName: true, surname: true, preferredName: true } },
  reportabilityAssessedBy: {
    select: { id: true, firstName: true, lastName: true },
  },
  shift: {
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      serviceTitle: true,
      locationLabel: true,
      participantName: true,
      customerId: true,
      assignedWorkerId: true,
      status: true,
    },
  },
  attachments: { orderBy: { uploadedAt: 'asc' as const } },
  history: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      actor: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  actions: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      assignedUser: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.IncidentInclude;

type IncidentRow = Prisma.IncidentGetPayload<{ include: typeof incidentInclude }>;

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalFileStorageService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    private readonly permissions: PermissionsService,
  ) {}

  async createIncident(
    organisationId: string,
    userId: string,
    role: string,
    dto: CreateIncidentDto,
  ) {
    this.assertEmployee(role);
    await this.assertUserInOrg(organisationId, userId);

    const shift = await this.prisma.shift.findFirst({
      where: { id: dto.shiftId, organisationId },
    });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    if (shift.assignedWorkerId !== userId) {
      throw new ForbiddenException('You can only report incidents on your assigned shift');
    }
    if (shift.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Incidents can only be reported from an in-progress shift',
      );
    }

    let customerId = dto.participantId ?? shift.customerId ?? null;
    if (customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, organisationId },
        select: { id: true },
      });
      if (!customer) {
        throw new BadRequestException('Participant not found in this organisation');
      }
      customerId = customer.id;
    }

    const reporter = await this.prisma.user.findFirstOrThrow({
      where: { id: userId, organisationId },
      select: { id: true, firstName: true, lastName: true },
    });

    const occurredOn = this.parseDateOnly(dto.date);
    const approximateTime = this.normaliseTime(dto.approximateTime);
    const participantName =
      dto.participantName?.trim() || shift.participantName || null;
    const reference = await this.nextReference(organisationId);
    const severity = dto.severity as IncidentSeverity;
    const actorName = `${reporter.firstName} ${reporter.lastName}`.trim();

    const createdId = await this.prisma.$transaction(async (tx) => {
      const incident = await tx.incident.create({
        data: {
          organisationId,
          reference,
          shiftId: shift.id,
          customerId,
          reporterId: userId,
          type: dto.type as IncidentType,
          initialSeverity: severity,
          currentSeverity: severity,
          status: 'PENDING_REVIEW',
          occurredOn,
          approximateTime,
          location: dto.location.trim(),
          peopleInvolved: (dto.peopleInvolved ?? '').trim(),
          participantName,
          description: dto.description.trim(),
          immediateAction: dto.immediateAction.trim(),
          nextSteps: (dto.nextSteps ?? '').trim(),
        },
      });

      await tx.incidentHistory.create({
        data: {
          incidentId: incident.id,
          actorId: userId,
          actorName,
          action: 'Incident submitted',
          detail: 'Submitted from an active shift.',
        },
      });

      await tx.incidentAction.createMany({
        data: [
          {
            incidentId: incident.id,
            kind: 'WELLBEING_FOLLOW_UP',
            description: 'Wellbeing follow-up with people involved',
            status: 'OPEN',
          },
          {
            incidentId: incident.id,
            kind: 'REPORTABILITY_REVIEW',
            description: 'Manager reportability review',
            status: 'OPEN',
          },
        ],
      });

      await tx.incidentHistory.create({
        data: {
          incidentId: incident.id,
          actorId: userId,
          actorName,
          action: 'Follow-up action created',
          detail: 'Wellbeing follow-up; Manager reportability review',
        },
      });

      return incident.id;
    });

    void this.notifyManagersOfNewIncident({
      organisationId,
      incidentId: createdId,
      reference,
      reporterName: actorName,
      severity,
      participantName,
    });

    return this.getIncident(organisationId, userId, role, createdId);
  }

  async listIncidents(
    organisationId: string,
    userId: string,
    role: string,
    query: ListIncidentsQueryDto = {},
  ) {
    await this.assertCanList(organisationId, role);

    const where: Prisma.IncidentWhereInput = { organisationId };

    if (role === 'EMPLOYEE') {
      where.reporterId = userId;
    }

    if (query.status) where.status = query.status as IncidentStatus;
    if (query.severity) where.currentSeverity = query.severity as IncidentSeverity;
    if (query.type) where.type = query.type as IncidentType;

    if (query.dateFrom || query.dateTo) {
      where.occurredOn = {};
      if (query.dateFrom) where.occurredOn.gte = this.parseDateOnly(query.dateFrom);
      if (query.dateTo) where.occurredOn.lte = this.parseDateOnly(query.dateTo);
    }

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { reference: { contains: q, mode: 'insensitive' } },
        { participantName: { contains: q, mode: 'insensitive' } },
        { reporter: { firstName: { contains: q, mode: 'insensitive' } } },
        { reporter: { lastName: { contains: q, mode: 'insensitive' } } },
        { location: { contains: q, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prisma.incident.findMany({
      where,
      include: incidentInclude,
      orderBy: [{ createdAt: 'desc' }],
    });

    return rows.map((row) => this.toIncidentDto(row));
  }

  async getIncident(
    organisationId: string,
    userId: string,
    role: string,
    incidentId: string,
  ) {
    await this.assertCanList(organisationId, role);
    const incident = await this.findOrgIncident(organisationId, incidentId);
    this.assertCanView(role, userId, incident);

    if (
      role === 'ORG_ADMIN' ||
      (await this.permissions.hasAction(organisationId, role, 'MANAGE_INCIDENTS'))
    ) {
      await this.maybeRecordManagerView(organisationId, userId, incident);
      return this.toIncidentDto(await this.findOrgIncident(organisationId, incidentId));
    }

    return this.toIncidentDto(incident);
  }

  async updateIncident(
    organisationId: string,
    userId: string,
    role: string,
    incidentId: string,
    dto: UpdateIncidentDto,
  ) {
    await this.assertManageIncidents(organisationId, role);

    const hasChange =
      dto.status !== undefined ||
      dto.severity !== undefined ||
      dto.managementNotes !== undefined ||
      dto.reportabilityDecision !== undefined ||
      dto.reportabilityRationale !== undefined ||
      dto.reportabilityExternalRef !== undefined ||
      dto.reportabilityNotifyNotes !== undefined ||
      dto.reportabilityNotified !== undefined;

    if (!hasChange) {
      throw new BadRequestException('No updates provided');
    }

    const incident = await this.findOrgIncident(organisationId, incidentId);
    const actor = await this.actorName(organisationId, userId);
    const data: Prisma.IncidentUpdateInput = {};
    const history: Array<{
      actorId: string;
      actorName: string;
      action: string;
      detail?: string;
    }> = [];

    if (dto.severity && dto.severity !== incident.currentSeverity) {
      // initialSeverity is never overwritten
      data.currentSeverity = dto.severity as IncidentSeverity;
      history.push({
        actorId: userId,
        actorName: actor,
        action: 'Severity changed',
        detail: `${incident.currentSeverity} → ${dto.severity} (initial ${incident.initialSeverity} preserved)`,
      });
    }

    if (dto.status && dto.status !== incident.status) {
      this.assertValidTransition(incident.status, dto.status as IncidentStatus);
      data.status = dto.status as IncidentStatus;

      if (dto.status === 'RESOLVED') {
        data.resolvedAt = incident.resolvedAt ?? new Date();
        history.push({
          actorId: userId,
          actorName: actor,
          action: 'Incident resolved',
          detail: `${incident.status} → RESOLVED`,
        });
      } else if (dto.status === 'CLOSED') {
        data.resolvedAt = incident.resolvedAt ?? new Date();
        history.push({
          actorId: userId,
          actorName: actor,
          action: 'Incident closed',
          detail: `${incident.status} → CLOSED`,
        });
      } else {
        if (incident.resolvedAt) data.resolvedAt = null;
        history.push({
          actorId: userId,
          actorName: actor,
          action: 'Status changed',
          detail: `${incident.status} → ${dto.status}`,
        });
      }
    }

    if (
      dto.managementNotes !== undefined &&
      dto.managementNotes !== incident.managementNotes
    ) {
      data.managementNotes = dto.managementNotes;
      history.push({
        actorId: userId,
        actorName: actor,
        action: 'Management notes updated',
      });
    }

    const reportabilityTouched =
      dto.reportabilityDecision !== undefined ||
      dto.reportabilityRationale !== undefined ||
      dto.reportabilityExternalRef !== undefined ||
      dto.reportabilityNotifyNotes !== undefined ||
      dto.reportabilityNotified !== undefined;

    if (reportabilityTouched) {
      if (dto.reportabilityDecision !== undefined) {
        data.reportabilityDecision =
          dto.reportabilityDecision as IncidentReportabilityDecision;
      }
      if (dto.reportabilityRationale !== undefined) {
        data.reportabilityRationale = dto.reportabilityRationale;
      }
      if (dto.reportabilityExternalRef !== undefined) {
        data.reportabilityExternalRef = dto.reportabilityExternalRef;
      }
      if (dto.reportabilityNotifyNotes !== undefined) {
        data.reportabilityNotifyNotes = dto.reportabilityNotifyNotes;
      }
      if (dto.reportabilityNotified === true) {
        data.reportabilityNotifiedAt = new Date();
      } else if (dto.reportabilityNotified === false) {
        data.reportabilityNotifiedAt = null;
      }

      if (
        dto.reportabilityDecision &&
        dto.reportabilityDecision !== 'NOT_ASSESSED'
      ) {
        data.reportabilityAssessedAt = new Date();
        data.reportabilityAssessedBy = { connect: { id: userId } };
      }

      const decision =
        dto.reportabilityDecision ?? incident.reportabilityDecision;
      history.push({
        actorId: userId,
        actorName: actor,
        action: 'Reportability reviewed',
        detail:
          decision === 'REPORTABLE'
            ? 'Decision: reportable'
            : decision === 'NOT_REPORTABLE'
              ? 'Decision: not reportable'
              : 'Decision cleared',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.incident.update({ where: { id: incident.id }, data });
      for (const entry of history) {
        await tx.incidentHistory.create({
          data: {
            incidentId: incident.id,
            actorId: entry.actorId,
            actorName: entry.actorName,
            action: entry.action,
            detail: entry.detail,
          },
        });
      }
    });

    const shouldNotifyReporter =
      (dto.status !== undefined && dto.status !== incident.status) ||
      (dto.severity !== undefined && dto.severity !== incident.currentSeverity) ||
      (dto.reportabilityDecision !== undefined &&
        dto.reportabilityDecision !== incident.reportabilityDecision);

    if (shouldNotifyReporter && incident.reporterId !== userId) {
      void this.notifyReporterOfUpdate({
        organisationId,
        reporterId: incident.reporterId,
        reference: incident.reference,
        actorName: actor,
        status: (dto.status as IncidentStatus | undefined) ?? incident.status,
        severityChanged: Boolean(
          dto.severity && dto.severity !== incident.currentSeverity,
        ),
        statusChanged: Boolean(dto.status && dto.status !== incident.status),
        reportabilityChanged: Boolean(
          dto.reportabilityDecision &&
            dto.reportabilityDecision !== incident.reportabilityDecision,
        ),
      });
    }

    return this.getIncident(organisationId, userId, role, incidentId);
  }

  async createAction(
    organisationId: string,
    userId: string,
    role: string,
    incidentId: string,
    dto: CreateIncidentActionDto,
  ) {
    await this.assertManageIncidents(organisationId, role);
    const incident = await this.findOrgIncident(organisationId, incidentId);
    const actor = await this.actorName(organisationId, userId);

    if (dto.assignedUserId) {
      await this.assertUserInOrg(organisationId, dto.assignedUserId);
    }

    const action = await this.prisma.$transaction(async (tx) => {
      const created = await tx.incidentAction.create({
        data: {
          incidentId: incident.id,
          kind: dto.kind ?? 'CUSTOM',
          description: dto.description.trim(),
          assignedUserId: dto.assignedUserId ?? null,
          dueDate: dto.dueDate ? this.parseDateOnly(dto.dueDate) : null,
          notes: (dto.notes ?? '').trim(),
          status: 'OPEN',
        },
        include: {
          assignedUser: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await tx.incidentHistory.create({
        data: {
          incidentId: incident.id,
          actorId: userId,
          actorName: actor,
          action: 'Follow-up action created',
          detail: created.description,
        },
      });

      return created;
    });

    if (action.assignedUserId && action.assignedUserId !== userId) {
      void this.notifications.notifyUser(action.assignedUserId, organisationId, {
        type: 'INFO',
        title: 'Incident follow-up assigned',
        message: `${actor} assigned you a follow-up on ${incident.reference}: ${action.description}`,
        link: `/manager/incidents/${incident.id}`,
      });
    }

    return this.toActionDto(action);
  }

  async updateAction(
    organisationId: string,
    userId: string,
    role: string,
    incidentId: string,
    actionId: string,
    dto: UpdateIncidentActionDto,
  ) {
    await this.assertManageIncidents(organisationId, role);
    const incident = await this.findOrgIncident(organisationId, incidentId);
    const existing = incident.actions.find((a) => a.id === actionId);
    if (!existing) {
      throw new NotFoundException('Follow-up action not found');
    }

    if (dto.assignedUserId) {
      await this.assertUserInOrg(organisationId, dto.assignedUserId);
    }

    const actor = await this.actorName(organisationId, userId);
    const data: Prisma.IncidentActionUpdateInput = {};
    const changes: string[] = [];

    if (dto.description !== undefined && dto.description !== existing.description) {
      data.description = dto.description.trim();
      changes.push('description');
    }
    if (dto.notes !== undefined && dto.notes !== existing.notes) {
      data.notes = dto.notes;
      changes.push('notes');
    }
    if (dto.status !== undefined && dto.status !== existing.status) {
      data.status = dto.status;
      data.completedAt =
        dto.status === 'DONE' ? new Date() : dto.status === 'CANCELLED' ? existing.completedAt : null;
      changes.push(`status → ${dto.status}`);
    }
    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate ? this.parseDateOnly(dto.dueDate) : null;
      changes.push('due date');
    }
    if (dto.assignedUserId !== undefined) {
      data.assignedUser = dto.assignedUserId
        ? { connect: { id: dto.assignedUserId } }
        : { disconnect: true };
      changes.push('assignee');
    }

    if (changes.length === 0) {
      throw new BadRequestException('No action updates provided');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.incidentAction.update({
        where: { id: actionId },
        data,
        include: {
          assignedUser: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await tx.incidentHistory.create({
        data: {
          incidentId: incident.id,
          actorId: userId,
          actorName: actor,
          action: 'Follow-up action updated',
          detail: `${existing.description}: ${changes.join(', ')}`,
        },
      });

      return row;
    });

    if (
      dto.assignedUserId &&
      dto.assignedUserId !== existing.assignedUserId &&
      dto.assignedUserId !== userId
    ) {
      void this.notifications.notifyUser(dto.assignedUserId, organisationId, {
        type: 'INFO',
        title: 'Incident follow-up assigned',
        message: `${actor} assigned you a follow-up on ${incident.reference}: ${updated.description}`,
        link: `/manager/incidents/${incident.id}`,
      });
    }

    return this.toActionDto(updated);
  }

  async uploadAttachment(
    organisationId: string,
    userId: string,
    role: string,
    incidentId: string,
    file: MulterUpload | undefined,
  ) {
    await this.assertCanList(organisationId, role);
    const incident = await this.findOrgIncident(organisationId, incidentId);
    await this.assertCanUpload(organisationId, role, userId, incident);

    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only PDF, JPG, PNG, or WEBP files are allowed');
    }
    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('File must be between 1 byte and 8 MB');
    }

    const buffer =
      file.buffer ?? (file.path ? readFileSync(file.path) : undefined);
    if (!buffer) {
      throw new BadRequestException('File content is missing');
    }

    const storageKey = this.storage.buildIncidentKey({
      organisationId,
      incidentId: incident.id,
      originalName: file.originalname,
    });
    this.storage.put(storageKey, buffer);

    const actor = await this.actorName(organisationId, userId);

    const attachment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.incidentAttachment.create({
        data: {
          incidentId: incident.id,
          fileName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          storageKey,
          uploadedById: userId,
        },
      });

      await tx.incidentHistory.create({
        data: {
          incidentId: incident.id,
          actorId: userId,
          actorName: actor,
          action: 'Attachment added',
          detail: file.originalname,
        },
      });

      return created;
    });

    return this.toAttachmentDto(attachment);
  }

  async downloadAttachment(
    organisationId: string,
    userId: string,
    role: string,
    incidentId: string,
    attachmentId: string,
    res: { set: (headers: Record<string, string>) => void },
  ) {
    await this.assertCanList(organisationId, role);
    const incident = await this.findOrgIncident(organisationId, incidentId);
    this.assertCanView(role, userId, incident);

    const attachment = incident.attachments.find((a) => a.id === attachmentId);
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    try {
      const stream = this.storage.openReadStream(attachment.storageKey);
      res.set({
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `attachment; filename="${attachment.fileName.replace(/"/g, '')}"`,
      });
      return new StreamableFile(stream);
    } catch {
      throw new NotFoundException('Attachment file missing from storage');
    }
  }

  async deleteAttachment(
    organisationId: string,
    userId: string,
    role: string,
    incidentId: string,
    attachmentId: string,
  ) {
    await this.assertCanList(organisationId, role);
    const incident = await this.findOrgIncident(organisationId, incidentId);
    await this.assertCanUpload(organisationId, role, userId, incident);

    const attachment = incident.attachments.find((a) => a.id === attachmentId);
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const actor = await this.actorName(organisationId, userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.incidentAttachment.delete({ where: { id: attachment.id } });
      await tx.incidentHistory.create({
        data: {
          incidentId: incident.id,
          actorId: userId,
          actorName: actor,
          action: 'Attachment removed',
          detail: attachment.fileName,
        },
      });
    });

    this.storage.delete(attachment.storageKey);
    return { ok: true };
  }

  private async maybeRecordManagerView(
    organisationId: string,
    userId: string,
    incident: IncidentRow,
  ) {
    const already = incident.history.some(
      (h) => h.actorId === userId && h.action === 'Incident reviewed',
    );
    if (already) return;

    const actor = await this.actorName(organisationId, userId);
    await this.prisma.incidentHistory.create({
      data: {
        incidentId: incident.id,
        actorId: userId,
        actorName: actor,
        action: 'Incident reviewed',
        detail: 'Opened in manager register',
      },
    });
  }

  private async notifyManagersOfNewIncident(args: {
    organisationId: string;
    incidentId: string;
    reference: string;
    reporterName: string;
    severity: IncidentSeverity;
    participantName: string | null;
  }) {
    const link = `/manager/incidents/${args.incidentId}`;
    const message = `${args.reporterName} reported ${args.reference} (${args.severity})${
      args.participantName ? ` for ${args.participantName}` : ''
    }.`;

    void this.notifications.notifyRole(args.organisationId, 'MANAGER', {
      type: args.severity === 'CRITICAL' || args.severity === 'HIGH' ? 'WARNING' : 'INFO',
      title: 'New incident reported',
      message,
      link,
    });
    void this.notifications.notifyRole(args.organisationId, 'ORG_ADMIN', {
      type: args.severity === 'CRITICAL' || args.severity === 'HIGH' ? 'WARNING' : 'INFO',
      title: 'New incident reported',
      message,
      link,
    });

    try {
      const [organisation, recipients] = await Promise.all([
        this.prisma.organisation.findUniqueOrThrow({
          where: { id: args.organisationId },
          select: { name: true },
        }),
        this.prisma.user.findMany({
          where: {
            organisationId: args.organisationId,
            role: { in: ['MANAGER', 'ORG_ADMIN'] },
            status: 'ACTIVE',
          },
          select: { email: true },
        }),
      ]);

      await this.mail.sendIncidentSubmittedEmail({
        to: recipients.map((r) => r.email),
        reporterName: args.reporterName,
        reference: args.reference,
        severity: args.severity,
        participantName: args.participantName ?? '',
        organisationName: organisation.name,
        incidentId: args.incidentId,
      });
    } catch (error) {
      this.logger.error('Failed to send incident submitted email', error);
    }
  }

  private async notifyReporterOfUpdate(args: {
    organisationId: string;
    reporterId: string;
    reference: string;
    actorName: string;
    status: IncidentStatus;
    severityChanged: boolean;
    statusChanged: boolean;
    reportabilityChanged: boolean;
  }) {
    const parts: string[] = [];
    if (args.statusChanged) {
      parts.push(`status is now ${args.status.split('_').join(' ').toLowerCase()}`);
    }
    if (args.severityChanged) parts.push('severity was updated');
    if (args.reportabilityChanged) parts.push('reportability was reviewed');

    void this.notifications.notifyUser(args.reporterId, args.organisationId, {
      type: args.status === 'RESOLVED' || args.status === 'CLOSED' ? 'SUCCESS' : 'INFO',
      title: `Incident ${args.reference} updated`,
      message: `${args.actorName} updated your incident${parts.length ? `: ${parts.join('; ')}` : ''}.`,
      // Employees do not have a dedicated incident detail route yet — send them to shifts.
      link: '/employee/shifts',
    });
  }

  private assertValidTransition(from: IncidentStatus, to: IncidentStatus) {
    const allowed = STATUS_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Cannot change status from ${from} to ${to}`,
      );
    }
  }

  private async findOrgIncident(organisationId: string, incidentId: string) {
    const incident = await this.prisma.incident.findFirst({
      where: { id: incidentId, organisationId },
      include: incidentInclude,
    });
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }
    return incident;
  }

  private async assertUserInOrg(organisationId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organisationId },
      select: { id: true },
    });
    if (!user) {
      throw new ForbiddenException('User does not belong to this organisation');
    }
  }

  private async actorName(organisationId: string, userId: string) {
    const user = await this.prisma.user.findFirstOrThrow({
      where: { id: userId, organisationId },
      select: { firstName: true, lastName: true },
    });
    return `${user.firstName} ${user.lastName}`.trim();
  }

  private async nextReference(organisationId: string) {
    const year = new Date().getFullYear();
    const prefix = `INC-${year}-`;
    const latest = await this.prisma.incident.findFirst({
      where: {
        organisationId,
        reference: { startsWith: prefix },
      },
      orderBy: { reference: 'desc' },
      select: { reference: true },
    });

    let next = 1;
    if (latest?.reference) {
      const n = Number(latest.reference.slice(prefix.length));
      if (Number.isFinite(n) && n >= next) next = n + 1;
    }
    return `${prefix}${String(next).padStart(4, '0')}`;
  }

  private parseDateOnly(value: string) {
    const day = value.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      throw new BadRequestException('Invalid date');
    }
    return new Date(`${day}T00:00:00.000Z`);
  }

  private normaliseTime(value: string) {
    const trimmed = value.trim();
    if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed.slice(0, 5);
    throw new BadRequestException('Approximate time must be HH:mm');
  }

  private assertEmployee(role: string) {
    if (role !== 'EMPLOYEE') {
      throw new ForbiddenException('Only employees can report incidents from a shift');
    }
  }

  private async assertManageIncidents(organisationId: string, role: string) {
    await this.permissions.assertAction(
      organisationId,
      role,
      'MANAGE_INCIDENTS',
    );
  }

  private async assertCanList(organisationId: string, role: string) {
    if (role === 'EMPLOYEE' || role === 'ORG_ADMIN') return;
    await this.permissions.assertPage(organisationId, role, 'INCIDENTS');
  }

  private assertCanView(
    role: string,
    userId: string,
    incident: Pick<Incident, 'reporterId'>,
  ) {
    if (role === 'EMPLOYEE' && incident.reporterId !== userId) {
      throw new ForbiddenException('Not your incident');
    }
  }

  private async assertCanUpload(
    organisationId: string,
    role: string,
    userId: string,
    incident: Pick<Incident, 'reporterId' | 'status'>,
  ) {
    if (role === 'ORG_ADMIN') return;
    if (await this.permissions.hasAction(organisationId, role, 'MANAGE_INCIDENTS')) {
      return;
    }
    if (role === 'EMPLOYEE') {
      if (incident.reporterId !== userId) {
        throw new ForbiddenException('Not your incident');
      }
      if (incident.status !== 'PENDING_REVIEW') {
        throw new BadRequestException(
          'Attachments can only be added while the incident is pending review',
        );
      }
      return;
    }
    throw new ForbiddenException('Not allowed to upload attachments');
  }

  private toIncidentDto(row: IncidentRow) {
    const shiftLabel = row.shift
      ? `${this.formatShiftDate(row.shift.date)} · ${row.shift.startTime}–${row.shift.endTime} · ${row.shift.serviceTitle}`
      : null;

    const assessedBy = row.reportabilityAssessedBy
      ? `${row.reportabilityAssessedBy.firstName} ${row.reportabilityAssessedBy.lastName}`.trim()
      : null;

    return {
      id: row.id,
      reference: row.reference,
      status: row.status,
      severity: row.currentSeverity,
      initialSeverity: row.initialSeverity,
      currentSeverity: row.currentSeverity,
      type: row.type,
      date: row.occurredOn.toISOString().slice(0, 10),
      approximateTime: row.approximateTime,
      reportedAt: row.createdAt.toISOString(),
      location: row.location,
      peopleInvolved: row.peopleInvolved,
      participantId: row.customerId,
      participantName: row.participantName,
      reporterId: row.reporterId,
      reporterName: `${row.reporter.firstName} ${row.reporter.lastName}`.trim(),
      shiftId: row.shiftId,
      shiftLabel,
      description: row.description,
      immediateAction: row.immediateAction,
      nextSteps: row.nextSteps,
      managementNotes: row.managementNotes,
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      attachments: row.attachments.map((a) => this.toAttachmentDto(a)),
      followUpActions: row.actions.map((a) => this.toActionDto(a)),
      actions: row.actions.map((a) => this.toActionDto(a)),
      reportability: {
        decision: row.reportabilityDecision,
        assessed: row.reportabilityDecision !== 'NOT_ASSESSED',
        reportable:
          row.reportabilityDecision === 'REPORTABLE'
            ? true
            : row.reportabilityDecision === 'NOT_REPORTABLE'
              ? false
              : null,
        notes: row.reportabilityRationale,
        rationale: row.reportabilityRationale,
        externalRef: row.reportabilityExternalRef,
        notifyNotes: row.reportabilityNotifyNotes,
        notifiedAt: row.reportabilityNotifiedAt?.toISOString() ?? null,
        assessedAt: row.reportabilityAssessedAt?.toISOString() ?? null,
        assessedBy,
      },
      history: row.history.map((h) => this.toHistoryDto(h)),
      allowedStatusTransitions: STATUS_TRANSITIONS[row.status] ?? [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toActionDto(
    action: IncidentAction & {
      assignedUser?: { id: string; firstName: string; lastName: string } | null;
    },
  ) {
    const assigneeName = action.assignedUser
      ? `${action.assignedUser.firstName} ${action.assignedUser.lastName}`.trim()
      : null;

    return {
      id: action.id,
      kind: action.kind,
      description: action.description,
      text: action.description,
      assignedUserId: action.assignedUserId,
      assignee: assigneeName ?? undefined,
      assignedUserName: assigneeName,
      dueDate: action.dueDate ? action.dueDate.toISOString().slice(0, 10) : null,
      status: action.status,
      done: action.status === 'DONE',
      notes: action.notes,
      completedAt: action.completedAt?.toISOString() ?? null,
      createdAt: action.createdAt.toISOString(),
      updatedAt: action.updatedAt.toISOString(),
    };
  }

  private toAttachmentDto(attachment: IncidentAttachment) {
    return {
      id: attachment.id,
      name: attachment.fileName,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      sizeLabel: this.formatBytes(attachment.sizeBytes),
      uploadedAt: attachment.uploadedAt.toISOString(),
    };
  }

  private toHistoryDto(
    entry: IncidentHistory & {
      actor: { id: string; firstName: string; lastName: string } | null;
    },
  ) {
    return {
      id: entry.id,
      at: entry.createdAt.toISOString(),
      actor: entry.actorName,
      actorId: entry.actorId,
      action: entry.action,
      detail: entry.detail,
    };
  }

  private formatShiftDate(date: Date) {
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  private formatBytes(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
}
