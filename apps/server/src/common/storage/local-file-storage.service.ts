import { Injectable } from '@nestjs/common';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FileStorage, StoredFileMeta } from './file-storage.interface';

@Injectable()
export class LocalFileStorageService implements FileStorage {
  constructor(private readonly rootDir: string) {
    mkdirSync(rootDir, { recursive: true });
  }

  async save(
    storedName: string,
    buffer: Buffer,
    meta: { mimeType: string; originalName: string },
  ): Promise<StoredFileMeta> {
    writeFileSync(join(this.rootDir, storedName), buffer);
    return {
      storedName,
      originalName: meta.originalName,
      mimeType: meta.mimeType,
      size: buffer.length,
    };
  }

  openReadStream(storedName: string) {
    return createReadStream(join(this.rootDir, storedName));
  }

  exists(storedName: string) {
    return existsSync(join(this.rootDir, storedName));
  }
}
