import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { R2ObjectStorageService } from './r2-object-storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('R2ObjectStorageService', () => {
  const getSignedUrlMock = getSignedUrl as jest.MockedFunction<
    typeof getSignedUrl
  >;

  const createService = () => {
    const configService = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          R2_ENDPOINT: 'https://example.r2.cloudflarestorage.com',
          R2_ACCESS_KEY_ID: 'key',
          R2_SECRET_ACCESS_KEY: 'secret',
          R2_BUCKET: 'bucket',
          R2_REGION: 'auto',
          R2_SIGNED_URL_EXPIRES_SECONDS: '600',
        };
        return map[key];
      }),
    } as unknown as ConfigService;

    const service = new R2ObjectStorageService(configService);
    const client = (
      service as unknown as {
        client: { send: (...args: unknown[]) => Promise<unknown> };
      }
    ).client;

    return { service, client };
  };

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('debe crear signed URL de PUT con headers requeridos', async () => {
    const { service } = createService();
    getSignedUrlMock.mockResolvedValue('https://signed-url');

    const result = await service.createSignedPutUrl({
      key: 'lodgings/x/staging',
      contentType: 'image/jpeg',
      contentLength: 123,
    });

    expect(getSignedUrlMock).toHaveBeenCalled();
    expect(result).toEqual({
      url: 'https://signed-url',
      method: 'PUT',
      requiredHeaders: {
        'Content-Type': 'image/jpeg',
        'Content-Length': '123',
      },
      expiresInSeconds: 600,
    });
  });

  it('debe devolver exists=true en headObject cuando storage responde', async () => {
    const { service, client } = createService();
    jest.spyOn(client, 'send').mockResolvedValue({
      ContentLength: 10,
      ContentType: 'image/webp',
      ETag: 'etag',
      LastModified: new Date('2026-01-01T00:00:00Z'),
    });

    const result = await service.headObject('a');

    expect(result.exists).toBe(true);
    expect(result.bytes).toBe(10);
    expect(result.mime).toBe('image/webp');
  });

  it('debe devolver exists=false en headObject cuando storage responde 404', async () => {
    const { service, client } = createService();
    jest.spyOn(client, 'send').mockRejectedValue({
      name: 'NotFound',
      $metadata: { httpStatusCode: 404 },
    });

    const result = await service.headObject('a');

    expect(result).toEqual({ exists: false });
  });

  it('debe devolver true/false en objectExists según headObject', async () => {
    const { service } = createService();
    jest.spyOn(service, 'headObject').mockResolvedValueOnce({ exists: true });
    await expect(service.objectExists('a')).resolves.toBe(true);

    jest.spyOn(service, 'headObject').mockResolvedValueOnce({ exists: false });
    await expect(service.objectExists('b')).resolves.toBe(false);
  });

  it('debe devolver stream y metadata en getObjectStream', async () => {
    const { service, client } = createService();
    jest.spyOn(client, 'send').mockResolvedValue({
      Body: Readable.from(['hola']),
      ContentLength: 4,
      ContentType: 'text/plain',
      ETag: 'etag',
    });

    const result = await service.getObjectStream('a');
    const chunks: Buffer[] = [];
    for await (const chunk of result.stream as AsyncIterable<unknown>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }

    expect(Buffer.concat(chunks).toString()).toBe('hola');
    expect(result.bytes).toBe(4);
    expect(result.mime).toBe('text/plain');
  });

  it('debe devolver stream vacío en getObjectStream cuando no existe el objeto', async () => {
    const { service, client } = createService();
    jest.spyOn(client, 'send').mockRejectedValue({ name: 'NoSuchKey' });

    const result = await service.getObjectStream('a');
    const chunks: Buffer[] = [];
    for await (const chunk of result.stream as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }

    expect(Buffer.concat(chunks).length).toBe(0);
  });

  it('debe subir objeto convirtiendo stream a buffer con ContentLength', async () => {
    const { service, client } = createService();
    const sendSpy = jest.spyOn(client, 'send').mockResolvedValue({});

    await service.putObject({
      key: 'a.txt',
      body: Readable.from(['abc']),
      contentType: 'text/plain',
    });

    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  it('debe borrar objeto', async () => {
    const { service, client } = createService();
    const sendSpy = jest.spyOn(client, 'send').mockResolvedValue({});

    await service.deleteObject('a');

    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  it('debe fallar si falta una variable requerida en constructor', () => {
    const configService = {
      get: jest.fn((key: string) => (key === 'R2_ENDPOINT' ? undefined : 'x')),
    } as unknown as ConfigService;

    expect(() => new R2ObjectStorageService(configService)).toThrow(
      'Falta configurar R2_ENDPOINT en .env',
    );
  });
});
