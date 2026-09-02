export const FILE_STORAGE = Symbol('FILE_STORAGE');

export type StoredFileMeta = {
  storedName: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export interface FileStorage {
  save(
    key: string,
    buffer: Buffer,
    meta: { mimeType: string; originalName: string },
  ): Promise<StoredFileMeta>;

  openReadStream(storedName: string): NodeJS.ReadableStream;

  exists(storedName: string): boolean;
}
