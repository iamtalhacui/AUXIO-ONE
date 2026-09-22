import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LocalFileStorageService } from '../../common/storage/local-file-storage.service';
import { OrganisationsService } from '../organisations/organisations.service';
import {
  isMandatoryFieldKey,
  mandatoryLabel,
  MANDATORY_CUSTOMER_DOCS,
} from './customer-docs';
import type { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import type { CreateOpportunityDto, UpdateOpportunityDto } from './dto/opportunity.dto';

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
};

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalFileStorageService,
    private readonly organisations: OrganisationsService,
  ) {}

  // ── Role gate: Manager only for CRM / customers in v1 ──

  private assertManager(role: string) {
    if (role !== 'MANAGER') {
      throw new ForbiddenException('Only managers can manage customers and CRM');
    }
  }

  private displayName(c: {
    firstName: string;
    middleName: string | null;
    preferredName: string | null;
    surname: string;
  }) {
    const first = c.preferredName?.trim() || c.firstName;
    const middle = c.middleName?.trim();
    return [first, middle, c.surname].filter(Boolean).join(' ');
  }

  private parseOptionalDate(value?: string | null) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date value');
    }
    return date;
  }

  private assertPlanDates(start?: Date | null, end?: Date | null) {
    if (start && end && end < start) {
      throw new BadRequestException('Plan end date cannot be before plan start date');
    }
  }

  private assertPlausibleDob(dob: Date | null) {
    if (!dob) return;
    const year = dob.getUTCFullYear();
    const nowYear = new Date().getUTCFullYear();
    if (year < 1900 || year > nowYear) {
      throw new BadRequestException('Date of birth year is outside allowed limits');
    }
  }

  private toCustomerDto(
    customer: {
      id: string;
      organisationId: string;
      firstName: string;
      middleName: string | null;
      preferredName: string | null;
      surname: string;
      email: string | null;
      phone: string | null;
      dateOfBirth: Date | null;
      address: string | null;
      serviceLine: string;
      planStartDate: Date | null;
      planEndDate: Date | null;
      status: string;
      supportSummary: string | null;
      emergencyContactName: string | null;
      emergencyContactPhone: string | null;
      goals: string | null;
      risks: string | null;
      sourceOpportunityId: string | null;
      activatedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      documents?: Array<{
        id: string;
        kind: string;
        fieldKey: string;
        label: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        uploadedAt: Date;
      }>;
    },
  ) {
    const documents = customer.documents ?? [];
    const uploadedMandatory = new Set(
      documents.filter((d) => d.kind === 'MANDATORY').map((d) => d.fieldKey),
    );
    const mandatoryProgress = MANDATORY_CUSTOMER_DOCS.map((slot) => ({
      fieldKey: slot.fieldKey,
      label: slot.label,
      uploaded: uploadedMandatory.has(slot.fieldKey),
      document: documents.find((d) => d.fieldKey === slot.fieldKey) ?? null,
    }));
    const mandatoryComplete = mandatoryProgress.every((slot) => slot.uploaded);

    return {
      id: customer.id,
      organisationId: customer.organisationId,
      firstName: customer.firstName,
      middleName: customer.middleName,
      preferredName: customer.preferredName,
      surname: customer.surname,
      displayName: this.displayName(customer),
      email: customer.email,
      phone: customer.phone,
      dateOfBirth: customer.dateOfBirth,
      address: customer.address,
      serviceLine: customer.serviceLine,
      planStartDate: customer.planStartDate,
      planEndDate: customer.planEndDate,
      status: customer.status,
      supportSummary: customer.supportSummary,
      emergencyContactName: customer.emergencyContactName,
      emergencyContactPhone: customer.emergencyContactPhone,
      goals: customer.goals,
      risks: customer.risks,
      sourceOpportunityId: customer.sourceOpportunityId,
      activatedAt: customer.activatedAt,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      mandatoryDocs: mandatoryProgress,
      optionalDocs: documents.filter((d) => d.kind === 'OPTIONAL'),
      mandatoryComplete,
      canActivate: customer.status === 'ONBOARDING' && mandatoryComplete,
    };
  }

  // ── Customers ──

  async listCustomers(organisationId: string, role: string) {
    this.assertManager(role);
    const rows = await this.prisma.customer.findMany({
      where: { organisationId },
      orderBy: { createdAt: 'desc' },
      include: { documents: true },
    });
    return rows.map((row) => this.toCustomerDto(row));
  }

  async getCustomer(organisationId: string, role: string, customerId: string) {
    this.assertManager(role);
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organisationId },
      include: { documents: { orderBy: { uploadedAt: 'desc' } } },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.toCustomerDto(customer);
  }

  async createCustomer(
    organisationId: string,
    actorId: string,
    role: string,
    dto: CreateCustomerDto,
    sourceOpportunityId?: string,
  ) {
    this.assertManager(role);

    const planStartDate = this.parseOptionalDate(dto.planStartDate);
    const planEndDate = this.parseOptionalDate(dto.planEndDate);
    this.assertPlanDates(planStartDate, planEndDate);
    const dateOfBirth = this.parseOptionalDate(dto.dateOfBirth);
    this.assertPlausibleDob(dateOfBirth);

    const customer = await this.prisma.customer.create({
      data: {
        organisationId,
        createdById: actorId,
        firstName: dto.firstName.trim(),
        middleName: dto.middleName?.trim() || null,
        preferredName: dto.preferredName?.trim() || null,
        surname: dto.surname.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        phone: dto.phone?.trim() || null,
        dateOfBirth,
        address: dto.address?.trim() || null,
        serviceLine: dto.serviceLine?.trim() || '',
        planStartDate,
        planEndDate,
        supportSummary: dto.supportSummary?.trim() || null,
        emergencyContactName: dto.emergencyContactName?.trim() || null,
        emergencyContactPhone: dto.emergencyContactPhone?.trim() || null,
        goals: dto.goals?.trim() || null,
        risks: dto.risks?.trim() || null,
        sourceOpportunityId: sourceOpportunityId ?? null,
        status: 'ONBOARDING',
      },
      include: { documents: true },
    });

    return this.toCustomerDto(customer);
  }

  async updateCustomer(
    organisationId: string,
    role: string,
    customerId: string,
    dto: UpdateCustomerDto,
  ) {
    this.assertManager(role);
    const existing = await this.prisma.customer.findFirst({
      where: { id: customerId, organisationId },
    });
    if (!existing) throw new NotFoundException('Customer not found');

    const planStartDate =
      dto.planStartDate !== undefined
        ? this.parseOptionalDate(dto.planStartDate)
        : existing.planStartDate;
    const planEndDate =
      dto.planEndDate !== undefined
        ? this.parseOptionalDate(dto.planEndDate)
        : existing.planEndDate;
    this.assertPlanDates(planStartDate, planEndDate);

    const dateOfBirth =
      dto.dateOfBirth !== undefined
        ? this.parseOptionalDate(dto.dateOfBirth)
        : existing.dateOfBirth;
    this.assertPlausibleDob(dateOfBirth);

    const customer = await this.prisma.customer.update({
      where: { id: existing.id },
      data: {
        firstName: dto.firstName?.trim(),
        middleName:
          dto.middleName !== undefined ? dto.middleName.trim() || null : undefined,
        preferredName:
          dto.preferredName !== undefined
            ? dto.preferredName.trim() || null
            : undefined,
        surname: dto.surname?.trim(),
        email:
          dto.email !== undefined ? dto.email.trim().toLowerCase() || null : undefined,
        phone: dto.phone !== undefined ? dto.phone.trim() || null : undefined,
        dateOfBirth,
        address: dto.address !== undefined ? dto.address.trim() || null : undefined,
        serviceLine:
          dto.serviceLine !== undefined ? dto.serviceLine.trim() : undefined,
        planStartDate,
        planEndDate,
        supportSummary:
          dto.supportSummary !== undefined
            ? dto.supportSummary.trim() || null
            : undefined,
        emergencyContactName:
          dto.emergencyContactName !== undefined
            ? dto.emergencyContactName.trim() || null
            : undefined,
        emergencyContactPhone:
          dto.emergencyContactPhone !== undefined
            ? dto.emergencyContactPhone.trim() || null
            : undefined,
        goals: dto.goals !== undefined ? dto.goals.trim() || null : undefined,
        risks: dto.risks !== undefined ? dto.risks.trim() || null : undefined,
      },
      include: { documents: true },
    });

    return this.toCustomerDto(customer);
  }

  // Activate when all mandatory docs are present (Manager end-to-end — no separate review).
  async activateCustomer(organisationId: string, role: string, customerId: string) {
    this.assertManager(role);
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organisationId },
      include: { documents: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    if (customer.status === 'ACTIVE') {
      return this.toCustomerDto(customer);
    }
    if (customer.status !== 'ONBOARDING') {
      throw new BadRequestException('Only onboarding customers can be activated');
    }

    const uploaded = new Set(
      customer.documents.filter((d) => d.kind === 'MANDATORY').map((d) => d.fieldKey),
    );
    const missing = MANDATORY_CUSTOMER_DOCS.filter((slot) => !uploaded.has(slot.fieldKey));
    if (missing.length) {
      throw new BadRequestException(
        `Upload required documents before activating: ${missing.map((m) => m.label).join(', ')}`,
      );
    }

    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: { status: 'ACTIVE', activatedAt: new Date() },
      include: { documents: true },
    });
    return this.toCustomerDto(updated);
  }

  async uploadMandatoryDocument(
    organisationId: string,
    actorId: string,
    role: string,
    customerId: string,
    fieldKey: string,
    file: UploadedFile | undefined,
  ) {
    this.assertManager(role);
    if (!isMandatoryFieldKey(fieldKey)) {
      throw new BadRequestException('Unknown mandatory document slot');
    }
    return this.upsertDocument({
      organisationId,
      actorId,
      customerId,
      fieldKey,
      label: mandatoryLabel(fieldKey),
      kind: 'MANDATORY',
      file,
    });
  }

  async uploadOptionalDocument(
    organisationId: string,
    actorId: string,
    role: string,
    customerId: string,
    label: string,
    file: UploadedFile | undefined,
  ) {
    this.assertManager(role);
    const trimmed = label.trim();
    if (!trimmed) throw new BadRequestException('Document label is required');
    const fieldKey = `OPTIONAL_${trimmed
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 40)}_${Date.now().toString(36)}`;

    return this.upsertDocument({
      organisationId,
      actorId,
      customerId,
      fieldKey,
      label: trimmed,
      kind: 'OPTIONAL',
      file,
    });
  }

  private async upsertDocument(args: {
    organisationId: string;
    actorId: string;
    customerId: string;
    fieldKey: string;
    label: string;
    kind: 'MANDATORY' | 'OPTIONAL';
    file: UploadedFile | undefined;
  }) {
    if (!args.file?.buffer?.length) {
      throw new BadRequestException('File is required');
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id: args.customerId, organisationId: args.organisationId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const existing = await this.prisma.customerDocument.findUnique({
      where: {
        customerId_fieldKey: {
          customerId: customer.id,
          fieldKey: args.fieldKey,
        },
      },
    });

    const storageKey = this.storage.buildCustomerKey({
      organisationId: args.organisationId,
      customerId: customer.id,
      fieldKey: args.fieldKey,
      originalName: args.file.originalname,
    });
    this.storage.put(storageKey, args.file.buffer);

    if (existing) {
      this.storage.delete(existing.storageKey);
      return this.prisma.customerDocument.update({
        where: { id: existing.id },
        data: {
          label: args.label,
          kind: args.kind,
          fileName: args.file.originalname,
          mimeType: args.file.mimetype,
          sizeBytes: args.file.size,
          storageKey,
          uploadedById: args.actorId,
          uploadedAt: new Date(),
        },
      });
    }

    return this.prisma.customerDocument.create({
      data: {
        customerId: customer.id,
        kind: args.kind,
        fieldKey: args.fieldKey,
        label: args.label,
        fileName: args.file.originalname,
        mimeType: args.file.mimetype,
        sizeBytes: args.file.size,
        storageKey,
        uploadedById: args.actorId,
      },
    });
  }

  async downloadDocument(
    organisationId: string,
    role: string,
    customerId: string,
    documentId: string,
  ) {
    this.assertManager(role);
    const doc = await this.prisma.customerDocument.findFirst({
      where: {
        id: documentId,
        customerId,
        customer: { organisationId },
      },
    });
    if (!doc) throw new NotFoundException('Document not found');
    const stream = this.storage.openReadStream(doc.storageKey);
    return {
      file: new StreamableFile(stream),
      mimeType: doc.mimeType,
      fileName: doc.fileName,
    };
  }

  async deleteDocument(
    organisationId: string,
    role: string,
    customerId: string,
    documentId: string,
  ) {
    this.assertManager(role);
    const doc = await this.prisma.customerDocument.findFirst({
      where: {
        id: documentId,
        customerId,
        customer: { organisationId },
      },
    });
    if (!doc) throw new NotFoundException('Document not found');
    this.storage.delete(doc.storageKey);
    await this.prisma.customerDocument.delete({ where: { id: doc.id } });
    return { message: 'Document deleted' };
  }

  // ── CRM opportunities ──

  async listOpportunities(organisationId: string, role: string) {
    this.assertManager(role);
    return this.prisma.crmOpportunity.findMany({
      where: { organisationId },
      orderBy: { updatedAt: 'desc' },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        convertedCustomer: { select: { id: true, firstName: true, surname: true, status: true } },
      },
    });
  }

  async pipelineSummary(organisationId: string, role: string) {
    this.assertManager(role);
    const rows = await this.prisma.crmOpportunity.findMany({
      where: { organisationId },
      select: { stage: true, estimatedAnnualValue: true },
    });

    const stages = ['ENQUIRY', 'QUALIFIED', 'PROPOSAL', 'ACCEPTED', 'LOST'] as const;
    return {
      note: 'Values are estimated annual amounts, not actual revenue.',
      stages: stages.map((stage) => {
        const items = rows.filter((row) => row.stage === stage);
        return {
          stage,
          count: items.length,
          estimatedAnnualValue: items.reduce(
            (sum, row) => sum + (row.estimatedAnnualValue ?? 0),
            0,
          ),
        };
      }),
    };
  }

  async createOpportunity(
    organisationId: string,
    actorId: string,
    role: string,
    dto: CreateOpportunityDto,
  ) {
    this.assertManager(role);
    return this.prisma.crmOpportunity.create({
      data: {
        organisationId,
        ownerId: actorId,
        title: dto.title.trim(),
        serviceLine: dto.serviceLine?.trim() || '',
        contactName: dto.contactName?.trim() || null,
        contactEmail: dto.contactEmail?.trim().toLowerCase() || null,
        contactPhone: dto.contactPhone?.trim() || null,
        stage: dto.stage ?? 'ENQUIRY',
        estimatedAnnualValue: dto.estimatedAnnualValue ?? null,
        nextFollowUpAt: this.parseOptionalDate(dto.nextFollowUpAt),
        followUpNote: dto.followUpNote?.trim() || null,
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        convertedCustomer: true,
      },
    });
  }

  async updateOpportunity(
    organisationId: string,
    role: string,
    opportunityId: string,
    dto: UpdateOpportunityDto,
  ) {
    this.assertManager(role);
    const existing = await this.prisma.crmOpportunity.findFirst({
      where: { id: opportunityId, organisationId },
    });
    if (!existing) throw new NotFoundException('Opportunity not found');

    return this.prisma.crmOpportunity.update({
      where: { id: existing.id },
      data: {
        title: dto.title?.trim(),
        serviceLine: dto.serviceLine !== undefined ? dto.serviceLine.trim() : undefined,
        contactName:
          dto.contactName !== undefined ? dto.contactName.trim() || null : undefined,
        contactEmail:
          dto.contactEmail !== undefined
            ? dto.contactEmail.trim().toLowerCase() || null
            : undefined,
        contactPhone:
          dto.contactPhone !== undefined ? dto.contactPhone.trim() || null : undefined,
        stage: dto.stage,
        estimatedAnnualValue: dto.estimatedAnnualValue,
        nextFollowUpAt:
          dto.nextFollowUpAt !== undefined
            ? this.parseOptionalDate(dto.nextFollowUpAt)
            : undefined,
        followUpNote:
          dto.followUpNote !== undefined ? dto.followUpNote.trim() || null : undefined,
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        convertedCustomer: {
          select: { id: true, firstName: true, surname: true, status: true },
        },
      },
    });
  }

  // Accepted opportunity → new customer (ONBOARDING). Opportunity stays linked.
  async convertOpportunity(
    organisationId: string,
    actorId: string,
    role: string,
    opportunityId: string,
  ) {
    this.assertManager(role);
    const opportunity = await this.prisma.crmOpportunity.findFirst({
      where: { id: opportunityId, organisationId },
      include: { convertedCustomer: true },
    });
    if (!opportunity) throw new NotFoundException('Opportunity not found');
    if (opportunity.convertedCustomer) {
      throw new BadRequestException('This opportunity is already linked to a customer');
    }

    const nameParts = (opportunity.contactName ?? opportunity.title).trim().split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Record';

    // Mark accepted if not already, then create customer with source link.
    if (opportunity.stage !== 'ACCEPTED') {
      await this.prisma.crmOpportunity.update({
        where: { id: opportunity.id },
        data: { stage: 'ACCEPTED' },
      });
    }

    const customer = await this.createCustomer(
      organisationId,
      actorId,
      role,
      {
        firstName,
        surname,
        email: opportunity.contactEmail ?? undefined,
        phone: opportunity.contactPhone ?? undefined,
        serviceLine: opportunity.serviceLine || undefined,
      },
      opportunity.id,
    );

    return {
      opportunityId: opportunity.id,
      customer,
      message: 'Opportunity converted to customer onboarding',
    };
  }

  /**
   * Manager home dashboard aggregate — customers + CRM only.
   * Soft-gates sections by whether CUSTOMERS / CRM modules are enabled.
   */
  async getManagerOverview(organisationId: string, role: string) {
    this.assertManager(role);

    const now = new Date();
    const joinWindowStart = startOfUtcDay(
      new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
    );

    const [org, moduleRows] = await Promise.all([
      this.prisma.organisation.findUnique({
        where: { id: organisationId },
        select: { name: true },
      }),
      this.organisations.listOrgModules(organisationId),
    ]);

    if (!org) throw new NotFoundException('Organisation not found');

    const customersEnabled = moduleRows.some(
      (m) => m.code === 'CUSTOMERS' && m.enabled,
    );
    const crmEnabled = moduleRows.some((m) => m.code === 'CRM' && m.enabled);

    const emptyStatusMix = {
      ONBOARDING: 0,
      ACTIVE: 0,
      PAUSED: 0,
      ARCHIVED: 0,
    };
    const emptyPipeline = {
      ENQUIRY: 0,
      QUALIFIED: 0,
      PROPOSAL: 0,
      ACCEPTED: 0,
      LOST: 0,
    };
    const emptyPipelineValue = { ENQUIRY: 0, QUALIFIED: 0, PROPOSAL: 0 };

    const joinCounts = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      const day = new Date(joinWindowStart.getTime() + i * 24 * 60 * 60 * 1000);
      joinCounts.set(dateKey(day), 0);
    }

    let customersTotal = 0;
    let customersActive = 0;
    const readyToActivate: Array<{
      customerId: string;
      displayName: string;
      serviceLine: string;
    }> = [];
    const incompleteOnboarding: Array<{
      customerId: string;
      displayName: string;
      missingDocs: number;
      serviceLine: string;
    }> = [];
    const customerStatusMix = { ...emptyStatusMix };

    if (customersEnabled) {
      const customers = await this.prisma.customer.findMany({
        where: { organisationId },
        select: {
          id: true,
          firstName: true,
          middleName: true,
          preferredName: true,
          surname: true,
          serviceLine: true,
          status: true,
          createdAt: true,
          documents: {
            where: { kind: 'MANDATORY' },
            select: { fieldKey: true },
          },
        },
      });

      customersTotal = customers.length;
      for (const c of customers) {
        customerStatusMix[c.status] += 1;
        if (c.status === 'ACTIVE') customersActive += 1;

        const key = dateKey(c.createdAt);
        if (joinCounts.has(key)) {
          joinCounts.set(key, (joinCounts.get(key) ?? 0) + 1);
        }

        if (c.status === 'ONBOARDING') {
          const uploaded = new Set(c.documents.map((d) => d.fieldKey));
          const missing = MANDATORY_CUSTOMER_DOCS.filter(
            (slot) => !uploaded.has(slot.fieldKey),
          ).length;
          const name = this.displayName(c);
          if (missing === 0) {
            readyToActivate.push({
              customerId: c.id,
              displayName: name,
              serviceLine: c.serviceLine,
            });
          } else {
            incompleteOnboarding.push({
              customerId: c.id,
              displayName: name,
              missingDocs: missing,
              serviceLine: c.serviceLine,
            });
          }
        }
      }
    }

    const overdueFollowUps: Array<{
      opportunityId: string;
      title: string;
      stage: string;
      nextFollowUpAt: Date;
      contactName: string | null;
    }> = [];
    const acceptedNotConverted: Array<{
      opportunityId: string;
      title: string;
      contactName: string | null;
      estimatedAnnualValue: number | null;
    }> = [];
    const crmPipeline = { ...emptyPipeline };
    const pipelineValueByStage = { ...emptyPipelineValue };
    let openPipelineCount = 0;

    if (crmEnabled) {
      const opportunities = await this.prisma.crmOpportunity.findMany({
        where: { organisationId },
        select: {
          id: true,
          title: true,
          stage: true,
          contactName: true,
          estimatedAnnualValue: true,
          nextFollowUpAt: true,
          convertedCustomer: { select: { id: true } },
        },
      });

      for (const o of opportunities) {
        crmPipeline[o.stage] += 1;

        if (
          o.stage === 'ENQUIRY' ||
          o.stage === 'QUALIFIED' ||
          o.stage === 'PROPOSAL'
        ) {
          openPipelineCount += 1;
          pipelineValueByStage[o.stage] += o.estimatedAnnualValue ?? 0;
        }

        if (
          o.nextFollowUpAt &&
          o.nextFollowUpAt < now &&
          o.stage !== 'ACCEPTED' &&
          o.stage !== 'LOST'
        ) {
          overdueFollowUps.push({
            opportunityId: o.id,
            title: o.title,
            stage: o.stage,
            nextFollowUpAt: o.nextFollowUpAt,
            contactName: o.contactName,
          });
        }

        if (o.stage === 'ACCEPTED' && !o.convertedCustomer) {
          acceptedNotConverted.push({
            opportunityId: o.id,
            title: o.title,
            contactName: o.contactName,
            estimatedAnnualValue: o.estimatedAnnualValue,
          });
        }
      }
    }

    const awaitingAction =
      readyToActivate.length +
      incompleteOnboarding.length +
      overdueFollowUps.length +
      acceptedNotConverted.length;

    return {
      organisation: { name: org.name },
      modules: { customersEnabled, crmEnabled },
      kpis: {
        customersTotal,
        customersActive,
        awaitingAction,
        openPipelineCount,
      },
      customerJoinsLast14Days: [...joinCounts.entries()].map(([date, count]) => ({
        date,
        count,
      })),
      attention: {
        readyToActivate,
        incompleteOnboarding,
        overdueFollowUps,
        acceptedNotConverted,
      },
      customerStatusMix,
      crmPipeline,
      pipelineValueByStage,
    };
  }
}
