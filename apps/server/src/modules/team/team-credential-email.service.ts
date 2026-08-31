import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export type TeamCredentialEmailPayload = {
  to: string;
  memberName: string;
  roleName: string;
  organisationName: string;
  password: string;
  loginUrl: string;
};

@Injectable()
export class TeamCredentialEmailService {
  private readonly logger = new Logger(TeamCredentialEmailService.name);
  private transporter: Transporter | null = null;

  private getGmailConfig(): { user: string; pass: string } | null {
    const user = process.env.GMAIL_USER?.trim();
    const pass = process.env.GMAIL_APP_PASSWORD?.trim();

    if (!user || !pass) {
      const missing = [
        !user ? 'GMAIL_USER' : null,
        !pass ? 'GMAIL_APP_PASSWORD' : null,
      ].filter(Boolean);
      this.logger.warn(`Gmail not configured — set in .env: ${missing.join(', ')}`);
      return null;
    }

    return { user, pass };
  }

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const gmail = this.getGmailConfig();
    if (!gmail) return null;

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: gmail,
    });

    return this.transporter;
  }

  async sendTeamMemberCredentials(payload: TeamCredentialEmailPayload) {
    const subject = `Your ${payload.organisationName} AUXIO One account`;
    const text = [
      `Hello ${payload.memberName},`,
      '',
      `An account has been created for you on AUXIO One.`,
      '',
      `Organisation: ${payload.organisationName}`,
      `Role: ${payload.roleName}`,
      `Email: ${payload.to}`,
      `Password: ${payload.password}`,
      '',
      `Sign in: ${payload.loginUrl}`,
      '',
      'You will need to change your password and complete onboarding on first login.',
      '',
      'If you did not expect this email, contact your organisation administrator.',
    ].join('\n');

    const html = `
      <p>Hello ${payload.memberName},</p>
      <p>An account has been created for you on <strong>AUXIO One</strong>.</p>
      <ul>
        <li><strong>Organisation:</strong> ${payload.organisationName}</li>
        <li><strong>Role:</strong> ${payload.roleName}</li>
        <li><strong>Email:</strong> ${payload.to}</li>
        <li><strong>Password:</strong> ${payload.password}</li>
      </ul>
      <p><a href="${payload.loginUrl}">Sign in to AUXIO One</a></p>
      <p>You will need to change your password and complete onboarding on first login.</p>
    `;

    const transporter = this.getTransporter();
    const from = process.env.GMAIL_USER?.trim() ?? 'noreply@auxio.one';

    if (!transporter) {
      this.logger.warn(
        `Team credential email for ${payload.to} not sent — content logged below`,
      );
      this.logger.log(text);
      return { sent: false, mode: 'log' as const };
    }

    await transporter.sendMail({
      from,
      to: payload.to,
      subject,
      text,
      html,
    });

    this.logger.log(`Team credential email sent to ${payload.to} via Gmail`);
    return { sent: true, mode: 'gmail' as const };
  }
}
