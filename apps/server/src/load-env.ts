import { config } from 'dotenv';
import { resolve } from 'path';

const repoRoot = resolve(__dirname, '../../..');

config({ path: resolve(repoRoot, 'packages/database/.env') });
config({ path: resolve(repoRoot, '.env') });
