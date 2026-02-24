import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import {
  ObjectStorageGetStreamResult,
  ObjectStorageHeadResult,
  ObjectStorageService,
} from '@media/interfaces/object-storage.service.interface';

@Injectable()
export class NoopObjectStorageService implements ObjectStorageService {
  createSignedPutUrl(): Promise<{
    url: string;
    method: 'PUT';
    requiredHeaders: Record<string, string>;
    expiresInSeconds: number;
  }> {
    return Promise.reject(new Error('ObjectStorageService no implementado'));
  }

  headObject(): Promise<ObjectStorageHeadResult> {
    return Promise.reject(new Error('ObjectStorageService no implementado'));
  }

  objectExists(): Promise<boolean> {
    return Promise.reject(new Error('ObjectStorageService no implementado'));
  }

  getObjectStream(): Promise<ObjectStorageGetStreamResult> {
    return Promise.resolve({
      stream: Readable.from([]),
    });
  }

  putObject(): Promise<void> {
    return Promise.reject(new Error('ObjectStorageService no implementado'));
  }

  deleteObject(): Promise<void> {
    return Promise.reject(new Error('ObjectStorageService no implementado'));
  }
}
