import { Readable } from 'stream';

export interface ObjectStorageHeadResult {
  exists: boolean;
  bytes?: number;
  mime?: string;
  etag?: string;
  lastModified?: Date;
}

export interface ObjectStorageGetStreamResult {
  stream: Readable;
  bytes?: number;
  mime?: string;
  etag?: string;
}

export interface ObjectStorageService {
  createSignedPutUrl(input: {
    key: string;
    contentType: string;
    contentLength?: number;
    expiresInSeconds?: number;
  }): Promise<{
    url: string;
    method: 'PUT';
    requiredHeaders: Record<string, string>;
    expiresInSeconds: number;
  }>;

  headObject(key: string): Promise<ObjectStorageHeadResult>;

  objectExists(key: string): Promise<boolean>;

  getObjectStream(key: string): Promise<ObjectStorageGetStreamResult>;

  putObject(input: {
    key: string;
    body: NodeJS.ReadableStream;
    contentType: string;
    cacheControl?: string;
  }): Promise<void>;

  deleteObject(key: string): Promise<void>;
}
