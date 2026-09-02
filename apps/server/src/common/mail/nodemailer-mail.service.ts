import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { Mailer, SendMailPayload, SendMailResult } from './mail.interface';

@Injectable()
export class NodemailerMailService implements Mailer {
  private readonly logger = new Logger(NodemailerMailService.name);
  private transporter: Transporter | null = null;

  private getGmailConfig(): { user: string; pass: string } | null {
    const user = process.env.GMAIL_USER?.trim();
    const pass = process.env.GMAIL_APP_PASSWORD?.trim();

    if (!user || !pass) {
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

  async send(payload: SendMailPayload): Promise<SendMailResult> {
    const transporter = this.getTransporter();
    const fromAddress = process.env.GMAIL_USER?.trim() ?? 'noreply@auxio.one';
    const from = `"AUXIO One" <${fromAddress}>`;

    if (!transporter) {
      this.logger.warn(`Email to ${payload.to} not sent — SMTP not configured`);
      this.logger.log(payload.text);
      return { sent: false, mode: 'log' };
    }

    try {
      const info = await transporter.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        replyTo: fromAddress,
      });

      this.logger.log(
        `Email sent to ${payload.to} (messageId=${info.messageId ?? 'unknown'})`,
      );
      return { sent: true, mode: 'smtp' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email to ${payload.to}: ${message}`);
      return { sent: false, mode: 'log', error: message };
    }
  }
}
