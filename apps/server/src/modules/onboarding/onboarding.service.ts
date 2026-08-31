import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@repo/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { isWorkforceLifecycleRole } from '../../common/user-lifecycle';
import { SaveOnboardingDto } from './dto/save-onboarding.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(userId: string, role?: string) {
    this.assertWorkforceRole(role);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        role: true,
        organisation: { select: { id: true, legalName: true, tradingName: true } },
        onboardingProfile: true,
      },
    });

    if (!user.organisationId) {
      throw new ForbiddenException('No organisation linked to your account');
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role?.code ?? null,
        roleName: user.role?.name ?? null,
      },
      organisation: user.organisation,
      profile: user.onboardingProfile
        ? {
            data: user.onboardingProfile.data as Record<string, unknown>,
            currentStep: user.onboardingProfile.currentStep,
            submittedAt: user.onboardingProfile.submittedAt,
            updatedAt: user.onboardingProfile.updatedAt,
          }
        : {
            data: {},
            currentStep: 0,
            submittedAt: null,
            updatedAt: null,
          },
    };
  }

  async getMyBasicProfile(userId: string, role?: string) {
    this.assertWorkforceRole(role);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        role: true,
        organisation: { select: { legalName: true, tradingName: true } },
        onboardingProfile: true,
      },
    });

    const data = (user.onboardingProfile?.data ?? {}) as Record<string, unknown>;
    const contact = (data.contact ?? {}) as Record<string, string>;
    const personal = (data.personal ?? {}) as Record<string, string>;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role?.code ?? null,
      roleName: user.role?.name ?? null,
      status: user.status,
      organisationName: user.organisation?.tradingName ?? user.organisation?.legalName ?? null,
      phone: contact.phone ?? '',
      addressLine1: contact.addressLine1 ?? '',
      addressLine2: contact.addressLine2 ?? '',
      suburb: contact.suburb ?? '',
      state: contact.state ?? '',
      postcode: contact.postcode ?? '',
      preferredName: personal.preferredName ?? '',
      dateOfBirth: personal.dateOfBirth ?? '',
      gender: personal.gender ?? '',
      languages: personal.languages ?? '',
      bio: personal.bio ?? '',
    };
  }

  async updateMyBasicProfile(
    userId: string,
    role: string | undefined,
    dto: UpdateMyProfileDto,
  ) {
    this.assertWorkforceRole(role);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { onboardingProfile: true },
    });

    if (!user.organisationId) {
      throw new ForbiddenException('No organisation linked to your account');
    }

    const existingData = (user.onboardingProfile?.data ?? {}) as Record<string, unknown>;
    const contact = { ...((existingData.contact ?? {}) as Record<string, string>) };
    const personal = { ...((existingData.personal ?? {}) as Record<string, string>) };

    if (dto.phone !== undefined) contact.phone = dto.phone;
    if (dto.addressLine1 !== undefined) contact.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) contact.addressLine2 = dto.addressLine2;
    if (dto.suburb !== undefined) contact.suburb = dto.suburb;
    if (dto.state !== undefined) contact.state = dto.state;
    if (dto.postcode !== undefined) contact.postcode = dto.postcode;
    if (dto.preferredName !== undefined) personal.preferredName = dto.preferredName;
    if (dto.dateOfBirth !== undefined) personal.dateOfBirth = dto.dateOfBirth;
    if (dto.gender !== undefined) personal.gender = dto.gender;
    if (dto.languages !== undefined) personal.languages = dto.languages;
    if (dto.bio !== undefined) personal.bio = dto.bio;

    const nextData = {
      ...existingData,
      contact,
      personal,
    };

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { name: dto.name ?? user.name },
      }),
      this.prisma.workerOnboardingProfile.upsert({
        where: { userId },
        create: {
          userId,
          organisationId: user.organisationId,
          data: nextData as Prisma.InputJsonValue,
        },
        update: {
          data: nextData as Prisma.InputJsonValue,
        },
      }),
    ]);

    return this.getMyBasicProfile(userId, role);
  }

  async saveMyProfile(userId: string, role: string | undefined, dto: SaveOnboardingDto) {
    this.assertWorkforceRole(role);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (!user.organisationId) {
      throw new ForbiddenException('No organisation linked to your account');
    }

    if (user.status !== 'PROCESSING') {
      throw new BadRequestException('Onboarding can only be edited while in PROCESSING status');
    }

    const profile = await this.prisma.workerOnboardingProfile.upsert({
      where: { userId },
      create: {
        userId,
        organisationId: user.organisationId,
        data: dto.data as Prisma.InputJsonValue,
        currentStep: dto.currentStep,
      },
      update: {
        data: dto.data as Prisma.InputJsonValue,
        currentStep: dto.currentStep,
      },
    });

    return {
      data: profile.data as Record<string, unknown>,
      currentStep: profile.currentStep,
      submittedAt: profile.submittedAt,
      updatedAt: profile.updatedAt,
    };
  }

  async submitMyProfile(userId: string, role: string | undefined) {
    this.assertWorkforceRole(role);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { onboardingProfile: true, role: true },
    });

    if (!user.organisationId) {
      throw new ForbiddenException('No organisation linked to your account');
    }

    if (user.status !== 'PROCESSING') {
      throw new BadRequestException('Profile has already been submitted or verified');
    }

    if (!user.onboardingProfile) {
      throw new BadRequestException('Complete your onboarding profile before submitting');
    }

    const data = user.onboardingProfile.data as Record<string, unknown>;
    this.validateSubmission(data);

    const [profile, updatedUser] = await this.prisma.$transaction([
      this.prisma.workerOnboardingProfile.update({
        where: { userId },
        data: { submittedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { status: 'SUBMITTED' },
        select: {
          id: true,
          email: true,
          name: true,
          organisationId: true,
          status: true,
          role: { select: { code: true } },
        },
      }),
      this.prisma.auditEntry.create({
        data: {
          organisationId: user.organisationId,
          actorUserId: userId,
          action: 'WORKER_ONBOARDING_SUBMIT',
          entityType: 'User',
          entityId: userId,
          afterJson: { status: 'SUBMITTED' },
        },
      }),
    ]);

    return {
      profile: {
        data: profile.data as Record<string, unknown>,
        currentStep: profile.currentStep,
        submittedAt: profile.submittedAt,
        updatedAt: profile.updatedAt,
      },
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role?.code,
        organisationId: updatedUser.organisationId,
        status: updatedUser.status,
      },
    };
  }

  async approveMember(organisationId: string, memberId: string, actorUserId: string) {
    const member = await this.prisma.user.findFirst({
      where: { id: memberId, organisationId },
      include: { role: true },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (!isWorkforceLifecycleRole(member.role?.code)) {
      throw new BadRequestException('Only workforce members can be approved via onboarding');
    }

    if (member.status !== 'SUBMITTED') {
      throw new BadRequestException('Member is not awaiting approval');
    }

    const updated = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: memberId },
        data: { status: 'VERIFIED' },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          role: { select: { code: true, name: true } },
        },
      }),
      this.prisma.auditEntry.create({
        data: {
          organisationId,
          actorUserId,
          action: 'WORKER_ONBOARDING_APPROVE',
          entityType: 'User',
          entityId: memberId,
          beforeJson: { status: 'SUBMITTED' },
          afterJson: { status: 'VERIFIED' },
        },
      }),
    ]);

    return updated[0];
  }

  async getMemberOnboarding(organisationId: string, memberId: string) {
    const member = await this.prisma.user.findFirst({
      where: { id: memberId, organisationId },
      include: {
        role: true,
        onboardingProfile: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (!isWorkforceLifecycleRole(member.role?.code)) {
      throw new BadRequestException('This member does not have a workforce onboarding profile');
    }

    return {
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        status: member.status,
        role: member.role
          ? { code: member.role.code, name: member.role.name }
          : null,
        createdAt: member.createdAt.toISOString(),
      },
      profile: member.onboardingProfile
        ? {
            data: member.onboardingProfile.data as Record<string, unknown>,
            currentStep: member.onboardingProfile.currentStep,
            submittedAt: member.onboardingProfile.submittedAt?.toISOString() ?? null,
            updatedAt: member.onboardingProfile.updatedAt.toISOString(),
          }
        : null,
    };
  }

  buildUploadedFileMeta(file: Express.Multer.File) {
    return {
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      uploadedAt: new Date().toISOString(),
      storedName: file.filename,
    };
  }

  async assertDocumentAccess(
    storedName: string,
    userId: string,
    role?: string,
    organisationId?: string | null,
  ) {
    if (storedName.includes('..') || storedName.includes('/') || storedName.includes('\\')) {
      throw new BadRequestException('Invalid file name');
    }

    const profiles = await this.prisma.workerOnboardingProfile.findMany({
      where:
        role === 'ORG_ADMIN' && organisationId
          ? { organisationId }
          : { userId },
      select: { userId: true, organisationId: true, data: true },
    });

    const owner = profiles.find((profile) => {
      const docs = (profile.data as Record<string, unknown>)?.documents as
        | Record<string, { storedName?: string } | null>
        | undefined;
      if (!docs) return false;
      return Object.values(docs).some((doc) => doc?.storedName === storedName);
    });

    if (!owner) {
      throw new NotFoundException('Document not found');
    }

    const isOwner = owner.userId === userId;
    const isOrgAdmin =
      role === 'ORG_ADMIN' && organisationId === owner.organisationId;

    if (!isOwner && !isOrgAdmin) {
      throw new ForbiddenException('You cannot access this document');
    }

    return owner;
  }

  private assertWorkforceRole(role?: string) {
    if (!isWorkforceLifecycleRole(role)) {
      throw new ForbiddenException('Onboarding is only available for workforce accounts');
    }
  }

  private validateSubmission(data: Record<string, unknown>) {
    const contact = data.contact as Record<string, string> | undefined;
    const personal = data.personal as Record<string, string> | undefined;
    const documents = data.documents as Record<string, unknown> | undefined;
    const compliance = data.compliance as Record<string, unknown> | undefined;

    if (!contact?.phone || !contact?.addressLine1 || !contact?.suburb || !contact?.state || !contact?.postcode) {
      throw new BadRequestException('Contact details are incomplete');
    }

    if (!personal?.dateOfBirth || !personal?.gender) {
      throw new BadRequestException('Personal details are incomplete');
    }

    const requiredDocs = ['photoId', 'qualifications', 'wwcc'];
    for (const doc of requiredDocs) {
      const file = documents?.[doc] as { storedName?: string } | undefined;
      if (!file?.storedName) {
        throw new BadRequestException(`Missing required document: ${doc}`);
      }
    }

    const serviceLines = compliance?.serviceLines as string[] | undefined;
    if (!serviceLines?.length) {
      throw new BadRequestException('Select at least one service line');
    }

    if (!compliance?.availabilityNotes) {
      throw new BadRequestException('Availability information is required');
    }

    const declarations = compliance?.declarations as Record<string, boolean> | undefined;
    if (!declarations?.termsAccepted || !declarations?.accuracyConfirmed) {
      throw new BadRequestException('All declarations must be accepted');
    }
  }
}
