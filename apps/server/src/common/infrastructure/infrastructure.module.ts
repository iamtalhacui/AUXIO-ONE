import { Global, Module } from '@nestjs/common';
import { join } from 'node:path';
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
    InviteTokenService,
    InviteEmailService,
  ],
  exports: [FILE_STORAGE, MAILER, InviteTokenService, InviteEmailService],
})
export class InfrastructureModule {}
