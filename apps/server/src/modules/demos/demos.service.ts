import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DemoRequestStatus } from 'database';
import { MailService } from '../../common/mail/mail.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDemoRequestDto } from './dto/create-demo-request.dto';
import { UpdateDemoRequestStatusDto } from './dto/update-demo-request-status.dto';

@Injectable()
export class DemosService {
  private readonly logger = new Logger(DemosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateDemoRequestDto) {
    const request = await this.prisma.demoRequest.create({
      data: {
        organisationName: dto.organisationName.trim(),
        contactName: dto.contactName.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone?.trim() || null,
        numberOfUsers: dto.numberOfUsers ?? null,
        preferredDate: new Date(dto.preferredDate),
        preferredTime: dto.preferredTime.trim(),
        message: dto.message?.trim() ?? '',
      },
    });

    void this.mail
      .sendDemoRequestEmail({
        organisationName: request.organisationName,
        contactName: request.contactName,
        email: request.email,
        phone: request.phone,
        numberOfUsers: request.numberOfUsers,
        preferredDate: request.preferredDate,
        preferredTime: request.preferredTime,
        message: request.message,
      })
      .catch((err: unknown) => {
        this.logger.error(
          `Failed to send demo request email for ${request.id}`,
          err instanceof Error ? err.stack : undefined,
        );
      });

    void this.notifications.notifySuperAdmins({
      type: 'INFO',
      title: 'New demo request',
      message: `${request.contactName} from ${request.organisationName} requested a demo.`,
      link: `/super-admin/demos/${request.id}`,
    });

    return {
      id: request.id,
      message: 'Demo request submitted successfully.',
    };
  }

  list() {
    return this.prisma.demoRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const request = await this.prisma.demoRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Demo request not found');
    return request;
  }

  async updateStatus(id: string, dto: UpdateDemoRequestStatusDto) {
    await this.getById(id);
    return this.prisma.demoRequest.update({
      where: { id },
      data: { status: dto.status as DemoRequestStatus },
    });
  }
}
