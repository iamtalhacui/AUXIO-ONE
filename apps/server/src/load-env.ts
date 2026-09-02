import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../..');

// Database seed vars first; repo root `.env` overrides (JWT, SMTP, CLIENT_URL, etc.)
loadEnv({ path: resolve(repoRoot, 'packages/database/.env') });
loadEnv({ path: resolve(repoRoot, '.env'), override: true });
loadEnv({ path: resolve(process.cwd(), '.env'), override: true });
