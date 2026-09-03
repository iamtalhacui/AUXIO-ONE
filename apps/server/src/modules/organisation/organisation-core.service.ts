import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ASSIGNABLE_MODULE_CODES } from './module-ceiling.constants';

@Injectable()
export class OrganisationCoreService {
  constructor(private prisma: PrismaService) {}

  async findOrganisationOrThrow(id: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id },
    });

    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }

    return organisation;
  }

  async assertUserEmailAvailable(email: string, excludeUserId?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing && existing.id !== excludeUserId) {
      throw new ConflictException(
        `A user with email ${email} already exists on the platform`,
      );
    }
  }

  async assertContactEmailAvailable(
    contactEmail: string,
    excludeOrganisationId?: string,
  ) {
    const existing = await this.prisma.organisation.findUnique({
      where: { contactEmail },
    });

    if (existing && existing.id !== excludeOrganisationId) {
      throw new ConflictException(
        `An organisation with contact email ${contactEmail} already exists`,
      );
    }
  }

  validateAssignableModuleCodes(moduleCodes: string[]) {
    const invalid = moduleCodes.filter(
      (code) =>
        !ASSIGNABLE_MODULE_CODES.includes(
          code as (typeof ASSIGNABLE_MODULE_CODES)[number],
        ),
    );

    if (invalid.length > 0) {
      throw new BadRequestException(
        `These module codes cannot be assigned to an organisation: ${invalid.join(', ')}`,
      );
    }
  }

  async findModulesByCodes(moduleCodes: string[]) {
    const uniqueCodes = [...new Set(moduleCodes)];
    const modules = await this.prisma.module.findMany({
      where: { code: { in: uniqueCodes } },
    });

    if (modules.length !== uniqueCodes.length) {
      const found = modules.map((module) => module.code);
      const missing = uniqueCodes.filter((code) => !found.includes(code));
      throw new BadRequestException(
        `Unknown module codes: ${missing.join(', ')}. Run database seed to sync the module catalogue.`,
      );
    }

    return modules;
  }
}
