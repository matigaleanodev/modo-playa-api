import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

@Injectable()
export class R2HealthService {
  private readonly logger = new Logger(R2HealthService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.getRequiredEnv('R2_ENDPOINT');
    const accessKeyId = this.getRequiredEnv('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.getRequiredEnv('R2_SECRET_ACCESS_KEY');
    this.bucket = this.getRequiredEnv('R2_BUCKET');

    this.client = new S3Client({
      endpoint,
      region: this.configService.get<string>('R2_REGION') ?? 'auto',
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      this.logger.log('Connecting to R2...');

      await this.client.send(
        new HeadBucketCommand({
          Bucket: this.bucket,
        }),
      );

      this.logger.log('Bucket access OK');

      return {
        ok: true,
        message: 'R2 connection successful',
      };
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);

      this.logger.error(`R2 connection failed: ${message}`);

      return {
        ok: false,
        message: `R2 connection failed: ${message}`,
      };
    }
  }

  async testPutObject(): Promise<void> {
    const key = 'healthcheck/test.txt';

    this.logger.log('Connecting to R2...');

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: 'R2 connection OK',
        ContentType: 'text/plain',
      }),
    );

    this.logger.log('Upload test OK');

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

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'name' in error) {
      const maybeError = error as { name?: string; message?: string };
      return [maybeError.name, maybeError.message].filter(Boolean).join(': ');
    }

    return 'Unknown error';
  }
}
