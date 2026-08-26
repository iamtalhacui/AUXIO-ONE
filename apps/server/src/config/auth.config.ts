export const authConfig = {
  jwtSecret: process.env.JWT_SECRET ?? 'development-only-secret',
  sessionDuration: process.env.SESSION_DURATION ?? '1d',
};
