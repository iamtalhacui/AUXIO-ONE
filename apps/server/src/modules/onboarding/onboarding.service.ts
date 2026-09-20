import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { Prisma } from 'database';
import { readFileSync } from 'fs';
import { LocalFileStorageService } from '../../common/storage/local-file-storage.service';
import { MailService } from '../../common/mail/mail.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { SaveOnboardingDraftDto } from './dto/save-onboarding-draft.dto';
import { OnboardingTemplatesService } from './onboarding-templates.service';
import type { OnboardingPayload } from './onboarding-templates';

const LOCKED_STATUSES = new Set(['PENDING_REVIEW', 'VERIFIED']);

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const ROLE_LABEL: Record<string, string> = {
  MANAGER: 'Manager',
  ROSTERING_EXPERT: 'Rostering Expert',
  EMPLOYEE: 'Employee',
};

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
};

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: OnboardingTemplatesService,
    private readonly storage: LocalFileStorageService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
  ) {}

  // Load the caller's onboarding state; creates nothing until first draft save.
  async getMine(userId: string, organisationId: string, role: string) {
    const user = await this.requireWorkforceUser(userId, organisationId, role);
    const template = this.templates.getTemplateForRole(user.role);

    const submission = await this.prisma.onboardingSubmission.findUnique({
      where: { userId: user.id },
      include: {
        documents: {
          select: {
            id: true,
            fieldKey: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: 'asc' },
        },
      },
    });

    return {
      onboardingStatus: user.onboardingStatus,
      editable: this.isEditable(user.onboardingStatus),
      template,
      submission: submission ? this.toSubmissionDto(submission) : null,
    };
  }

  // Create or update the caller's draft. Blocked while PENDING_REVIEW / VERIFIED.
  async saveDraft(
    userId: string,
    organisationId: string,
    role: string,
    dto: SaveOnboardingDraftDto,
  ) {
    const user = await this.requireWorkforceUser(userId, organisationId, role);

    if (!this.isEditable(user.onboardingStatus)) {
      throw new ForbiddenException(
        'Onboarding is locked while it is pending review or verified',
      );
    }

    this.templates.getTemplateForRole(user.role);

    const payload = this.normalizePayload(dto.payload);
    const existing = await this.prisma.onboardingSubmission.findUnique({
      where: { userId: user.id },
    });

    if (existing && LOCKED_STATUSES.has(existing.status)) {
      throw new ForbiddenException(
        'This onboarding submission can no longer be edited',
      );
    }

    const nextUserStatus =
      user.onboardingStatus === 'NOT_STARTED'
        ? 'IN_PROGRESS'
        : user.onboardingStatus;

    const submission = await this.prisma.$transaction(async (tx) => {
      const saved = existing
        ? await tx.onboardingSubmission.update({
            where: { id: existing.id },
            data: {
              currentStep: dto.currentStep ?? existing.currentStep,
              payload: payload as Prisma.InputJsonValue,
              // Keep CHANGES_REQUIRED until submit; otherwise stay IN_PROGRESS.
              status:
                existing.status === 'CHANGES_REQUIRED'
                  ? 'CHANGES_REQUIRED'
                  : 'IN_PROGRESS',
              roleSnapshot: user.role,
            },
            include: {
              documents: {
                select: {
                  id: true,
                  fieldKey: true,
                  fileName: true,
                  mimeType: true,
                  sizeBytes: true,
                  uploadedAt: true,
                },
                orderBy: { uploadedAt: 'asc' },
              },
            },
          })
        : await tx.onboardingSubmission.create({
            data: {
              userId: user.id,
              organisationId: user.organisationId,
              roleSnapshot: user.role,
              currentStep: dto.currentStep ?? 0,
              payload: payload as Prisma.InputJsonValue,
              status: 'IN_PROGRESS',
            },
            include: {
              documents: {
                select: {
                  id: true,
                  fieldKey: true,
                  fileName: true,
                  mimeType: true,
                  sizeBytes: true,
                  uploadedAt: true,
                },
                orderBy: { uploadedAt: 'asc' },
              },
            },
          });

      if (user.onboardingStatus !== nextUserStatus) {
        await tx.user.update({
          where: { id: user.id },
          data: { onboardingStatus: nextUserStatus },
        });
      }

      return saved;
    });

    const refreshed = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { onboardingStatus: true },
    });

    return {
      onboardingStatus: refreshed.onboardingStatus,
      editable: this.isEditable(refreshed.onboardingStatus),
      submission: this.toSubmissionDto(submission),
    };
  }

  // Validate draft + required docs, then lock as PENDING_REVIEW.
  async submit(userId: string, organisationId: string, role: string) {
    const user = await this.requireWorkforceUser(userId, organisationId, role);

    if (!this.isEditable(user.onboardingStatus)) {
      throw new ForbiddenException(
        'Onboarding is locked while it is pending review or verified',
      );
    }

    const existing = await this.prisma.onboardingSubmission.findUnique({
      where: { userId: user.id },
      include: {
        documents: { select: { fieldKey: true } },
      },
    });

    if (!existing) {
      throw new BadRequestException('Save a draft before submitting onboarding');
    }

    if (LOCKED_STATUSES.has(existing.status)) {
      throw new ForbiddenException(
        'This onboarding submission can no longer be edited',
      );
    }

    const payload = this.normalizePayload(
      (existing.payload ?? {}) as SaveOnboardingDraftDto['payload'],
    );

    this.templates.assertValidPayload(user.role, payload, {
      checkDocuments: true,
      uploadedFieldKeys: existing.documents.map((doc) => doc.fieldKey),
    });

    const submittedAt = new Date();

    const submission = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.onboardingSubmission.update({
        where: { id: existing.id },
        data: {
          status: 'PENDING_REVIEW',
          payload: payload as Prisma.InputJsonValue,
          submittedAt,
          reviewedAt: null,
          reviewedById: null,
          reviewNote: null,
          currentStep: 4,
          roleSnapshot: user.role,
        },
        include: {
          documents: {
            select: {
              id: true,
              fieldKey: true,
              fileName: true,
              mimeType: true,
              sizeBytes: true,
              uploadedAt: true,
            },
            orderBy: { uploadedAt: 'asc' },
          },
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          onboardingStatus: 'PENDING_REVIEW',
          onboardingCompletedAt: null,
        },
      });

      return saved;
    });

    try {
      const [member, organisation, admins] = await Promise.all([
        this.prisma.user.findUniqueOrThrow({
          where: { id: user.id },
          select: { firstName: true, lastName: true, role: true },
        }),
        this.prisma.organisation.findUniqueOrThrow({
          where: { id: organisationId },
          select: { name: true },
        }),
        this.prisma.user.findMany({
          where: {
            organisationId,
            role: 'ORG_ADMIN',
            status: 'ACTIVE',
          },
          select: { email: true },
        }),
      ]);

      await this.mail.sendOnboardingSubmittedEmail({
        to: admins.map((admin) => admin.email),
        memberName: `${member.firstName} ${member.lastName}`,
        organisationName: organisation.name,
        roleLabel: ROLE_LABEL[member.role] ?? member.role,
      });
    } catch (error) {
      this.logger.error('Failed to send onboarding submitted email', error);
    }

    void this.prisma.user
      .findUnique({ where: { id: user.id }, select: { firstName: true, lastName: true, role: true } })
      .then((member) => {
        if (!member) return;
        return this.notifications.notifyRole(organisationId, 'ORG_ADMIN', {
          type: 'INFO',
          title: 'Onboarding submitted for review',
          message: `${member.firstName} ${member.lastName} submitted their onboarding for review.`,
          link: `/org-admin/onboarding/${user.id}`,
        });
      });

    return {
      onboardingStatus: 'PENDING_REVIEW' as const,
      editable: false,
      submission: this.toSubmissionDto(submission),
    };
  }

  async uploadDocument(
    userId: string,
    organisationId: string,
    role: string,
    fieldKey: string,
    file: UploadedFile | undefined,
  ) {
    const user = await this.requireWorkforceUser(userId, organisationId, role);
    this.assertEditable(user.onboardingStatus);

    if (!file) {
      throw new BadRequestException('File is required');
    }

    const template = this.templates.getTemplateForRole(user.role);
    const need = template.documentNeeds.find((item) => item.key === fieldKey);
    if (!need) {
      throw new BadRequestException(`Unknown document field: ${fieldKey}`);
    }

    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only PDF, JPG, PNG, or WEBP files are allowed');
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('File must be between 1 byte and 8 MB');
    }

    const buffer =
      file.buffer ??
      (file.path ? readFileSync(file.path) : undefined);

    if (!buffer) {
      throw new BadRequestException('File content is missing');
    }

    const submission = await this.ensureEditableSubmission(user);

    const storageKey = this.storage.buildOnboardingKey({
      organisationId: user.organisationId,
      userId: user.id,
      fieldKey,
      originalName: file.originalname,
    });

    const existingDoc = await this.prisma.onboardingDocument.findUnique({
      where: {
        submissionId_fieldKey: {
          submissionId: submission.id,
          fieldKey,
        },
      },
    });

    this.storage.put(storageKey, buffer);

    const document = await this.prisma.$transaction(async (tx) => {
      if (existingDoc) {
        this.storage.delete(existingDoc.storageKey);
        return tx.onboardingDocument.update({
          where: { id: existingDoc.id },
          data: {
            fileName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            storageKey,
            uploadedAt: new Date(),
          },
        });
      }

      return tx.onboardingDocument.create({
        data: {
          submissionId: submission.id,
          fieldKey,
          fileName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          storageKey,
        },
      });
    });

    return {
      id: document.id,
      fieldKey: document.fieldKey,
      fileName: document.fileName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      uploadedAt: document.uploadedAt,
    };
  }

  async downloadDocument(
    userId: string,
    organisationId: string,
    role: string,
    documentId: string,
  ) {
    const user = await this.requireWorkforceUser(userId, organisationId, role);

    const document = await this.prisma.onboardingDocument.findFirst({
      where: {
        id: documentId,
        submission: {
          userId: user.id,
          organisationId: user.organisationId,
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    try {
      const stream = this.storage.openReadStream(document.storageKey);
      return {
        file: new StreamableFile(stream),
        fileName: document.fileName,
        mimeType: document.mimeType,
      };
    } catch {
      throw new NotFoundException('Document file is missing on disk');
    }
  }

  async deleteDocument(
    userId: string,
    organisationId: string,
    role: string,
    documentId: string,
  ) {
    const user = await this.requireWorkforceUser(userId, organisationId, role);
    this.assertEditable(user.onboardingStatus);

    const document = await this.prisma.onboardingDocument.findFirst({
      where: {
        id: documentId,
        submission: {
          userId: user.id,
          organisationId: user.organisationId,
        },
      },
      include: { submission: { select: { status: true } } },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (LOCKED_STATUSES.has(document.submission.status)) {
      throw new ForbiddenException('Documents cannot be changed while locked');
    }

    await this.prisma.onboardingDocument.delete({ where: { id: document.id } });
    this.storage.delete(document.storageKey);

    return { message: 'Document deleted' };
  }

  // ─── Org Admin review ───────────────────────────────────

  private requireOrgAdmin(actorRole: string) {
    if (actorRole !== 'ORG_ADMIN') {
      throw new ForbiddenException('Only organisation admins can review onboarding');
    }
  }

  async listForAdmin(organisationId: string, actorRole: string, status?: string) {
    this.requireOrgAdmin(actorRole);

    const where: Prisma.OnboardingSubmissionWhereInput = {
      organisationId,
    };

    if (status) {
      where.status = status as Prisma.EnumOnboardingStatusFilter['equals'];
    }

    const rows = await this.prisma.onboardingSubmission.findMany({
      where,
      orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }],
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true,
            onboardingStatus: true,
          },
        },
        documents: {
          select: { id: true, fieldKey: true, fileName: true, sizeBytes: true },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      roleSnapshot: row.roleSnapshot,
      submittedAt: row.submittedAt,
      reviewedAt: row.reviewedAt,
      reviewNote: row.reviewNote,
      updatedAt: row.updatedAt,
      documentCount: row.documents.length,
      user: row.user,
    }));
  }

  async getForAdmin(organisationId: string, actorRole: string, memberUserId: string) {
    this.requireOrgAdmin(actorRole);

    const submission = await this.prisma.onboardingSubmission.findFirst({
      where: { userId: memberUserId, organisationId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true,
            onboardingStatus: true,
          },
        },
        documents: {
          select: {
            id: true,
            fieldKey: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: 'asc' },
        },
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Onboarding submission not found');
    }

    const template = this.templates.getTemplateForRole(submission.roleSnapshot);

    return {
      template,
      user: submission.user,
      submission: {
        ...this.toSubmissionDto(submission),
        reviewedBy: submission.reviewedBy,
      },
    };
  }

  async downloadDocumentForAdmin(
    organisationId: string,
    actorRole: string,
    memberUserId: string,
    documentId: string,
  ) {
    this.requireOrgAdmin(actorRole);

    const document = await this.prisma.onboardingDocument.findFirst({
      where: {
        id: documentId,
        submission: {
          userId: memberUserId,
          organisationId,
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    try {
      const stream = this.storage.openReadStream(document.storageKey);
      return {
        file: new StreamableFile(stream),
        fileName: document.fileName,
        mimeType: document.mimeType,
      };
    } catch {
      throw new NotFoundException('Document file is missing on disk');
    }
  }

  async review(
    organisationId: string,
    actorRole: string,
    actorUserId: string,
    memberUserId: string,
    decision: 'VERIFIED' | 'CHANGES_REQUIRED',
    note?: string,
  ) {
    this.requireOrgAdmin(actorRole);

    if (decision === 'CHANGES_REQUIRED' && !note?.trim()) {
      throw new BadRequestException('A rejection reason is required');
    }

    const submission = await this.prisma.onboardingSubmission.findFirst({
      where: { userId: memberUserId, organisationId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            onboardingStatus: true,
            role: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Onboarding submission not found');
    }

    if (submission.status !== 'PENDING_REVIEW') {
      throw new BadRequestException(
        'Only submissions with PENDING_REVIEW status can be reviewed',
      );
    }

    const reviewedAt = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.onboardingSubmission.update({
        where: { id: submission.id },
        data: {
          status: decision,
          reviewedAt,
          reviewedById: actorUserId,
          reviewNote:
            decision === 'CHANGES_REQUIRED' ? note!.trim() : null,
        },
        include: {
          documents: {
            select: {
              id: true,
              fieldKey: true,
              fileName: true,
              mimeType: true,
              sizeBytes: true,
              uploadedAt: true,
            },
            orderBy: { uploadedAt: 'asc' },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              onboardingStatus: true,
            },
          },
        },
      });

      await tx.user.update({
        where: { id: memberUserId },
        data:
          decision === 'VERIFIED'
            ? {
                onboardingStatus: 'VERIFIED',
                onboardingCompletedAt: reviewedAt,
              }
            : {
                onboardingStatus: 'CHANGES_REQUIRED',
                onboardingCompletedAt: null,
              },
      });

      return saved;
    });

    try {
      const organisation = await this.prisma.organisation.findUniqueOrThrow({
        where: { id: organisationId },
        select: { name: true },
      });
      await this.mail.sendOnboardingDecisionEmail({
        to: submission.user.email,
        memberName: `${submission.user.firstName} ${submission.user.lastName}`,
        organisationName: organisation.name,
        decision,
        note: decision === 'CHANGES_REQUIRED' ? note?.trim() : null,
      });
    } catch (error) {
      this.logger.error('Failed to send onboarding decision email', error);
    }

    void this.notifications.notifyUser(memberUserId, organisationId, {
      type: decision === 'VERIFIED' ? 'SUCCESS' : 'WARNING',
      title:
        decision === 'VERIFIED' ? 'Onboarding verified' : 'Changes requested on your onboarding',
      message:
        decision === 'VERIFIED'
          ? 'Your onboarding has been verified. You now have full access.'
          : `Changes are needed: ${note?.trim()}`,
    });

    return {
      onboardingStatus: decision,
      submission: this.toSubmissionDto(updated),
      user: {
        ...updated.user,
        onboardingStatus: decision,
      },
    };
  }

  private assertEditable(status: string) {
    if (!this.isEditable(status)) {
      throw new ForbiddenException(
        'Onboarding is locked while it is pending review or verified',
      );
    }
  }

  private async ensureEditableSubmission(user: {
    id: string;
    organisationId: string;
    role: 'MANAGER' | 'ROSTERING_EXPERT' | 'EMPLOYEE' | string;
    onboardingStatus: string;
  }) {
    const existing = await this.prisma.onboardingSubmission.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      if (LOCKED_STATUSES.has(existing.status)) {
        throw new ForbiddenException(
          'This onboarding submission can no longer be edited',
        );
      }
      return existing;
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const submission = await tx.onboardingSubmission.create({
        data: {
          userId: user.id,
          organisationId: user.organisationId,
          roleSnapshot: user.role as 'MANAGER' | 'ROSTERING_EXPERT' | 'EMPLOYEE',
          currentStep: 2,
          payload: {},
          status: 'IN_PROGRESS',
        },
      });

      if (user.onboardingStatus === 'NOT_STARTED') {
        await tx.user.update({
          where: { id: user.id },
          data: { onboardingStatus: 'IN_PROGRESS' },
        });
      }

      return submission;
    });

    return created;
  }

  private isEditable(status: string) {
    return !LOCKED_STATUSES.has(status);
  }

  private async requireWorkforceUser(
    userId: string,
    organisationId: string,
    role: string,
  ) {
    if (!this.templates.requiresOnboarding(role)) {
      throw new ForbiddenException('Onboarding is not required for this role');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, organisationId },
      select: {
        id: true,
        organisationId: true,
        role: true,
        status: true,
        onboardingStatus: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }

    if (!this.templates.requiresOnboarding(user.role)) {
      throw new ForbiddenException('Onboarding is not required for this role');
    }

    return user;
  }

  private normalizePayload(payload: SaveOnboardingDraftDto['payload']): OnboardingPayload {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('payload must be an object');
    }

    return {
      personal:
        payload.personal && typeof payload.personal === 'object'
          ? payload.personal
          : {},
      work: payload.work && typeof payload.work === 'object' ? payload.work : {},
    };
  }

  private toSubmissionDto(submission: {
    id: string;
    userId: string;
    organisationId: string;
    roleSnapshot: string;
    currentStep: number;
    payload: Prisma.JsonValue;
    status: string;
    submittedAt: Date | null;
    reviewedAt: Date | null;
    reviewNote: string | null;
    createdAt: Date;
    updatedAt: Date;
    documents?: Array<{
      id: string;
      fieldKey: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      uploadedAt: Date;
    }>;
  }) {
    return {
      id: submission.id,
      userId: submission.userId,
      organisationId: submission.organisationId,
      roleSnapshot: submission.roleSnapshot,
      currentStep: submission.currentStep,
      payload: submission.payload,
      status: submission.status,
      submittedAt: submission.submittedAt,
      reviewedAt: submission.reviewedAt,
      reviewNote: submission.reviewNote,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      documents: submission.documents ?? [],
    };
  }
}
