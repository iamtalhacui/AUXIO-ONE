export const MAILER = Symbol('MAILER');

export type SendMailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendMailResult = {
  sent: boolean;
  mode: 'smtp' | 'log';
  error?: string;
};

export interface Mailer {
  send(payload: SendMailPayload): Promise<SendMailResult>;
}
