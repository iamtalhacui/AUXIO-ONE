import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InviteTokenService {
  private getExpiryDays(): number {
    const parsed = Number.parseInt(process.env.INVITE_EXPIRY_DAYS ?? '7', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
  }

  generate() {
    const token = randomBytes(32).toString('hex');
    const hash = this.hashToken(token);
    const expiresAt = new Date(
      Date.now() + this.getExpiryDays() * 24 * 60 * 60 * 1000,
    );

    return { token, hash, expiresAt };
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
