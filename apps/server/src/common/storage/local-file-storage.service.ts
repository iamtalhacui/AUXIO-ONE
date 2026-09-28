import { Injectable } from '@nestjs/common';
import { createReadStream, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { dirname, extname, join, resolve } from 'path';
import { randomUUID } from 'crypto';
import type { ReadStream } from 'fs';

@Injectable()
export class LocalFileStorageService {
  private readonly root = resolve(
    process.env.UPLOAD_ROOT ?? join(process.cwd(), 'uploads'),
  );

  put(relativeKey: string, buffer: Buffer) {
    const absolute = this.absolutePath(relativeKey);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, buffer);
    return relativeKey;
  }

  openReadStream(relativeKey: string): ReadStream {
    const absolute = this.absolutePath(relativeKey);
    if (!existsSync(absolute)) {
      throw new Error(`File not found: ${relativeKey}`);
    }
    return createReadStream(absolute);
  }

  exists(relativeKey: string) {
    return existsSync(this.absolutePath(relativeKey));
  }

  delete(relativeKey: string) {
    const absolute = this.absolutePath(relativeKey);
    if (existsSync(absolute)) {
      unlinkSync(absolute);
    }
  }

  buildOnboardingKey(args: {
    organisationId: string;
    userId: string;
    fieldKey: string;
    originalName: string;
  }) {
    const ext = extname(args.originalName).toLowerCase().slice(0, 12);
    const safeExt = /^\.[a-z0-9]+$/.test(ext) ? ext : '';
    return join(
      'onboarding',
      args.organisationId,
      args.userId,
      `${args.fieldKey}-${randomUUID()}${safeExt}`,
    );
  }

  // Customer (participant) evidence files — separate folder from workforce onboarding.
  buildCustomerKey(args: {
    organisationId: string;
    customerId: string;
    fieldKey: string;
    originalName: string;
  }) {
    const ext = extname(args.originalName).toLowerCase().slice(0, 12);
    const safeExt = /^\.[a-z0-9]+$/.test(ext) ? ext : '';
    const safeKey = args.fieldKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
    return join(
      'customers',
      args.organisationId,
      args.customerId,
      `${safeKey}-${randomUUID()}${safeExt}`,
    );
  }

  buildOrgLogoKey(args: { organisationId: string; originalName: string }) {
    const ext = extname(args.originalName).toLowerCase().slice(0, 12);
    const safeExt = /^\.[a-z0-9]+$/.test(ext) ? ext : '';
    return join('org-logos', args.organisationId, `logo-${randomUUID()}${safeExt}`);
  }

  buildIncidentKey(args: {
    organisationId: string;
    incidentId: string;
    originalName: string;
  }) {
    const ext = extname(args.originalName).toLowerCase().slice(0, 12);
    const safeExt = /^\.[a-z0-9]+$/.test(ext) ? ext : '';
    return join(
      'incidents',
      args.organisationId,
      args.incidentId,
      `${randomUUID()}${safeExt}`,
    );
  }

  private absolutePath(relativeKey: string) {
    const absolute = resolve(this.root, relativeKey);
    if (!absolute.startsWith(this.root)) {
      throw new Error('Invalid storage key');
    }
    return absolute;
  }
}
