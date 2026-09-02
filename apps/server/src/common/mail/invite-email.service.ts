import { Inject, Injectable, Logger } from '@nestjs/common';
import { MAILER, type Mailer } from './mail.interface';

export type InviteEmailPayload = {
  to: string;
  recipientName: string;
  organisationName: string;
  roleName: string;
  inviteUrl: string;
  expiresAt: Date;
};

@Injectable()
export class InviteEmailService {
  private readonly logger = new Logger(InviteEmailService.name);

  constructor(@Inject(MAILER) private mailer: Mailer) {}

  async sendInvite(payload: InviteEmailPayload) {
    const expiryLabel = payload.expiresAt.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const subject = `You're invited to ${payload.organisationName} on AUXIO One`;
    const text = [
      `Hello ${payload.recipientName},`,
      '',
      `You have been invited to join ${payload.organisationName} on AUXIO One as ${payload.roleName}.`,
      '',
      `Accept your invitation and set your password:`,
      payload.inviteUrl,
      '',
      `This link expires on ${expiryLabel}.`,
      '',
      'If you did not expect this email, you can ignore it.',
    ].join('\n');

    const html = `
      <p>Hello ${payload.recipientName},</p>
      <p>You have been invited to join <strong>${payload.organisationName}</strong> on AUXIO One as <strong>${payload.roleName}</strong>.</p>
      <p><a href="${payload.inviteUrl}">Accept invitation and set your password</a></p>
      <p>This link expires on ${expiryLabel}.</p>
      <p>If you did not expect this email, you can ignore it.</p>
    `;

    const result = await this.mailer.send({
      to: payload.to,
      subject,
      text,
      html,
    });

    if (!result.sent) {
      this.logger.warn(
        `Invite email for ${payload.to} was not sent (${result.mode})`,
      );
    }

    return result;
  }
}
