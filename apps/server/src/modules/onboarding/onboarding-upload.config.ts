import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { diskStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');

export const ONBOARDING_DOC_TYPES = [
  'photoId',
  'qualifications',
  'wwcc',
  'policeCheck',
  'firstAid',
] as const;

export type OnboardingDocType = (typeof ONBOARDING_DOC_TYPES)[number];

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

mkdirSync(UPLOADS_DIR, { recursive: true });

export const onboardingUploadOptions = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (
      req: Request & { user?: { sub: string } },
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) => {
      const docType = req.params.docType ?? 'file';
      const userId = req.user?.sub ?? 'unknown';
      const ext = extname(file.originalname).toLowerCase() || '.bin';
      const storedName = `${userId}-${docType}-${Date.now()}${ext}`;
      cb(null, storedName);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new BadRequestException('Only PDF, JPG, and PNG files are allowed'), false);
      return;
    }
    cb(null, true);
  },
};

export function assertOnboardingDocType(value: string): OnboardingDocType {
  if (!ONBOARDING_DOC_TYPES.includes(value as OnboardingDocType)) {
    throw new BadRequestException(`Invalid document type: ${value}`);
  }
  return value as OnboardingDocType;
}
