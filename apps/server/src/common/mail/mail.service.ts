import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      this.logger.warn('GMAIL_USER / GMAIL_APP_PASSWORD not set — emails will fail');
    }

    this.from = `"AUXIO One" <${user}>`;

    this.transporter = createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  /**
   * Sends the account setup email to a newly invited user.
   */
  async sendSetupEmail(
    to: string,
    recipientName: string,
    setupToken: string,
    options?: { roleLabel?: string; organisationName?: string },
  ) {
    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3000';
    const setupLink = `${clientUrl}/setup?token=${setupToken}`;
    const roleLabel = options?.roleLabel ?? 'Organisation Admin';
    const orgLine = options?.organisationName
      ? ` at <strong>${options.organisationName}</strong>`
      : '';

    const intro = options?.roleLabel
      ? `You've been invited to AUXIO One as a <strong>${roleLabel}</strong>${orgLine}.`
      : `Your organisation has been registered on AUXIO One and you've been assigned as the <strong>${roleLabel}</strong>.`;

    const html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color: #0f766e;">Welcome to AUXIO One</h2>
        <p>Hi ${recipientName},</p>
        <p>${intro}</p>
        <p>Click the button below to set your password and activate your account:</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${setupLink}"
             style="background: #0f766e; color: #fff; padding: 12px 28px;
                    border-radius: 8px; text-decoration: none; font-weight: 600;">
            Set up your account
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">
          This link expires in 7 days. If you didn't expect this email, you can ignore it.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">AUXIO One — Care operations platform</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: 'Set up your AUXIO One account',
      html,
    });

    this.logger.log(`Setup email sent to ${to}`);
  }
}
