import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

const repoRoot = resolve(process.cwd(), '../../');

// Database seed vars first; repo root `.env` overrides (SMTP, CLIENT_URL, etc.)
loadEnv({ path: resolve(repoRoot, 'packages/database/.env') });
loadEnv({ path: resolve(repoRoot, '.env'), override: true });
loadEnv({ path: resolve(process.cwd(), '.env'), override: true });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:3001',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
