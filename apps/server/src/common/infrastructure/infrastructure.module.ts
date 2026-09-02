import { Global, Module } from '@nestjs/common';
import { join } from 'node:path';
import { JOB_SCHEDULER } from '../jobs/job-scheduler.interface';
import { NoopJobSchedulerService } from '../jobs/noop-job-scheduler.service';
import { MAILER } from '../mail/mail.interface';
import { NodemailerMailService } from '../mail/nodemailer-mail.service';
import { InviteEmailService } from '../mail/invite-email.service';
import { InviteTokenService } from '../invite/invite-token.service';
import { FILE_STORAGE } from '../storage/file-storage.interface';
import { LocalFileStorageService } from '../storage/local-file-storage.service';

const uploadsDir = join(process.cwd(), 'uploads');

@Global()
@Module({
  providers: [
    {
      provide: FILE_STORAGE,
      useFactory: () => new LocalFileStorageService(uploadsDir),
    },
    {
      provide: MAILER,
      useClass: NodemailerMailService,
    },
    {
      provide: JOB_SCHEDULER,
      useClass: NoopJobSchedulerService,
    },
    InviteTokenService,
    InviteEmailService,
  ],
  exports: [FILE_STORAGE, MAILER, JOB_SCHEDULER, InviteTokenService, InviteEmailService],
})
export class InfrastructureModule {}
