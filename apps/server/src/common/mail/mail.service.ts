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

  async sendOnboardingSubmittedEmail(args: {
    to: string[];
    memberName: string;
    organisationName: string;
    roleLabel: string;
  }) {
    if (args.to.length === 0) return;

    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3000';
    const reviewLink = `${clientUrl}/org-admin/team`;

    const html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color: #0f766e;">Onboarding ready for review</h2>
        <p><strong>${args.memberName}</strong> (${args.roleLabel}) submitted onboarding for
           <strong>${args.organisationName}</strong>.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${reviewLink}"
             style="background: #0f766e; color: #fff; padding: 12px 28px;
                    border-radius: 8px; text-decoration: none; font-weight: 600;">
            Open team directory
          </a>
        </p>
        <p style="color: #999; font-size: 12px;">AUXIO One — Care operations platform</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.from,
      to: args.to.join(', '),
      subject: `Onboarding submitted — ${args.memberName}`,
      html,
    });

    this.logger.log(`Onboarding submitted email sent to ${args.to.join(', ')}`);
  }

  async sendOnboardingDecisionEmail(args: {
    to: string;
    memberName: string;
    organisationName: string;
    decision: 'VERIFIED' | 'CHANGES_REQUIRED';
    note?: string | null;
  }) {
    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3000';
    const approved = args.decision === 'VERIFIED';
    const link = `${clientUrl}/login`;

    const html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color: #0f766e;">${approved ? 'Onboarding approved' : 'Onboarding needs changes'}</h2>
        <p>Hi ${args.memberName},</p>
        <p>${
          approved
            ? `Your onboarding for <strong>${args.organisationName}</strong> has been verified. You can now access your workspace.`
            : `Your onboarding for <strong>${args.organisationName}</strong> needs a few updates before it can be approved.`
        }</p>
        ${
          !approved && args.note
            ? `<p style="background:#fdf2f2;border:1px solid #fecaca;padding:12px;border-radius:8px;"><strong>Admin note:</strong> ${args.note}</p>`
            : ''
        }
        <p style="text-align: center; margin: 32px 0;">
          <a href="${link}"
             style="background: #0f766e; color: #fff; padding: 12px 28px;
                    border-radius: 8px; text-decoration: none; font-weight: 600;">
            ${approved ? 'Go to login' : 'Sign in to update'}
          </a>
        </p>
        <p style="color: #999; font-size: 12px;">AUXIO One — Care operations platform</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.from,
      to: args.to,
      subject: approved
        ? `Onboarding approved — ${args.organisationName}`
        : `Onboarding changes required — ${args.organisationName}`,
      html,
    });

    this.logger.log(`Onboarding decision email sent to ${args.to}`);
  }

  async sendDemoRequestEmail(args: {
    organisationName: string;
    contactName: string;
    email: string;
    phone: string | null;
    numberOfUsers: number | null;
    preferredDate: Date;
    preferredTime: string;
    message: string;
  }) {
    const to =
      process.env.SUPER_ADMIN_EMAIL?.trim() ||
      process.env.GMAIL_USER?.trim();

    if (!to) {
      this.logger.warn('No SUPER_ADMIN_EMAIL / GMAIL_USER — demo notification skipped');
      return;
    }

    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3000';
    const dashboardLink = `${clientUrl}/super-admin/demos`;
    const preferredDate = args.preferredDate.toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const html = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #0f766e;">New demo request</h2>
        <p>A prospective customer booked a demo on AUXIO One.</p>
        <table style="width:100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #666; width: 160px;">Organisation</td>
            <td style="padding: 8px 0; font-weight: 600;">${args.organisationName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Contact name</td>
            <td style="padding: 8px 0; font-weight: 600;">${args.contactName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Contact email</td>
            <td style="padding: 8px 0;">
              <a href="mailto:${args.email}" style="color: #0f766e; font-weight: 600;">${args.email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Phone</td>
            <td style="padding: 8px 0;">${args.phone || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Number of users</td>
            <td style="padding: 8px 0;">${args.numberOfUsers ?? 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Preferred date</td>
            <td style="padding: 8px 0; font-weight: 600;">${preferredDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Preferred time</td>
            <td style="padding: 8px 0; font-weight: 600;">${args.preferredTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; vertical-align: top;">Message</td>
            <td style="padding: 8px 0;">${args.message || 'None'}</td>
          </tr>
        </table>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${dashboardLink}"
             style="background: #0f766e; color: #fff; padding: 12px 28px;
                    border-radius: 8px; text-decoration: none; font-weight: 600;">
            View demo requests
          </a>
        </p>
        <p style="color: #999; font-size: 12px;">AUXIO One — Care operations platform</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.from,
      to,
      replyTo: args.email,
      subject: `Demo request — ${args.organisationName}`,
      html,
    });

    this.logger.log(`Demo request email sent to ${to}`);
  }

  async sendPasswordResetOtp(to: string, recipientName: string, otp: string) {
    const html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color: #0f766e;">Reset your password</h2>
        <p>Hi ${recipientName},</p>
        <p>Use this 6-digit code to reset your AUXIO One password:</p>
        <p style="text-align: center; margin: 28px 0; letter-spacing: 0.35em; font-size: 28px; font-weight: 700; color: #0f766e;">
          ${otp}
        </p>
        <p style="color: #666; font-size: 13px;">
          This code expires in 15 minutes. If you did not request a reset, you can ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">AUXIO One — Care operations platform</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: 'Your AUXIO One password reset code',
      html,
    });

    this.logger.log(`Password reset OTP sent to ${to}`);
  }
}
