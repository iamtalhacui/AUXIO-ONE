import type { JwtSignOptions } from '@nestjs/jwt';

const defaultSessionDuration = '8h' as const satisfies JwtSignOptions['expiresIn'];

export const authConfig = {
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  sessionDuration: (process.env.SESSION_DURATION ??
    defaultSessionDuration) as JwtSignOptions['expiresIn'],
};
