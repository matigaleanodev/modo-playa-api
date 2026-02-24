import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { Buffer } from 'buffer';
import type {
  ObjectStorageGetStreamResult,
  ObjectStorageHeadResult,
  ObjectStorageService,
} from '@media/interfaces/object-storage.service.interface';

@Injectable()
export class R2ObjectStorageService implements ObjectStorageService {
  private readonly bucket: string;
  private readonly defaultSignedUrlExpiresSeconds: number;
  private readonly client: S3Client;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.getRequiredEnv('R2_ENDPOINT');
    const accessKeyId = this.getRequiredEnv('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.getRequiredEnv('R2_SECRET_ACCESS_KEY');

    this.bucket = this.getRequiredEnv('R2_BUCKET');
    this.defaultSignedUrlExpiresSeconds = Number(
      this.configService.get<string>('R2_SIGNED_URL_EXPIRES_SECONDS') ?? '600',
    );

    if (!Number.isFinite(this.defaultSignedUrlExpiresSeconds)) {
      throw new Error('R2_SIGNED_URL_EXPIRES_SECONDS inválido');
    }

    this.client = new S3Client({
      region: this.configService.get<string>('R2_REGION') ?? 'auto',
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async createSignedPutUrl(input: {
    key: string;
    contentType: string;
    contentLength?: number;
    expiresInSeconds?: number;
  }): Promise<{
    url: string;
    method: 'PUT';
    requiredHeaders: Record<string, string>;
    expiresInSeconds: number;
  }> {
    const expiresInSeconds =
      input.expiresInSeconds ?? this.defaultSignedUrlExpiresSeconds;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.key,
      ContentType: input.contentType,
      ...(input.contentLength ? { ContentLength: input.contentLength } : {}),
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });

    const requiredHeaders: Record<string, string> = {
      'Content-Type': input.contentType,
    };

    if (input.contentLength !== undefined) {
      requiredHeaders['Content-Length'] = String(input.contentLength);
    }

    return {
      url,
      method: 'PUT',
      requiredHeaders,
      expiresInSeconds,
    };
  }

  async headObject(key: string): Promise<ObjectStorageHeadResult> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      return {
        exists: true,
        bytes: result.ContentLength,
        mime: result.ContentType,
        etag: result.ETag,
        lastModified: result.LastModified,
      };
    } catch (error: unknown) {
      if (this.isNotFoundError(error)) {
        return { exists: false };
      }
      throw error;
    }
  }

  async objectExists(key: string): Promise<boolean> {
    const head = await this.headObject(key);
    return head.exists;
  }

  async getObjectStream(key: string): Promise<ObjectStorageGetStreamResult> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      const stream = this.toNodeReadable(result.Body);

      return {
        stream,
        bytes: result.ContentLength,
        mime: result.ContentType,
        etag: result.ETag,
      };
    } catch (error: unknown) {
      if (this.isNotFoundError(error)) {
        return {
          stream: Readable.from([]),
        };
      }
      throw error;
    }
  }

  async putObject(input: {
    key: string;
    body: NodeJS.ReadableStream;
    contentType: string;
    cacheControl?: string;
  }): Promise<void> {
    const body = await this.toUploadBody(input.body);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: body,
        ContentLength: body.length,
        ContentType: input.contentType,
        ...(input.cacheControl ? { CacheControl: input.cacheControl } : {}),
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  private getRequiredEnv(name: string): string {
    const value = this.configService.get<string>(name);

    if (!value || value.startsWith('"descripcion')) {
      throw new Error(`Falta configurar ${name} en .env`);
    }

    return value;
  }

  private toNodeReadable(body: unknown): Readable {
    if (!body) {
      throw new Error('Storage getObject sin body');
    }

    if (body instanceof Readable) {
      return body;
    }

    if (
      typeof body === 'object' &&
      body !== null &&
      'getReader' in body &&
      typeof (body as ReadableStream).getReader === 'function'
    ) {
      return Readable.fromWeb(
        body as unknown as import('stream/web').ReadableStream,
      );
    }

    throw new Error('Tipo de stream no soportado por ObjectStorageService');
  }

  private isNotFoundError(error: unknown): boolean {
    if (error instanceof NoSuchKey) {
      return true;
    }

    if (!error || typeof error !== 'object') {
      return false;
    }

    const maybeError = error as {
      name?: string;
      Code?: string;
      $metadata?: { httpStatusCode?: number };
    };

    return (
      maybeError.name === 'NotFound' ||
      maybeError.name === 'NoSuchKey' ||
      maybeError.Code === 'NotFound' ||
      maybeError.Code === 'NoSuchKey' ||
      maybeError.$metadata?.httpStatusCode === 404
    );
  }

  private async toUploadBody(body: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];

    for await (const chunk of body as AsyncIterable<unknown>) {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
        continue;
      }

      if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk));
        continue;
      }

      if (chunk instanceof Uint8Array) {
        chunks.push(Buffer.from(chunk));
        continue;
      }

      throw new Error('Chunk de stream no soportado para upload a R2');
    }

    return Buffer.concat(chunks);
  }
}
