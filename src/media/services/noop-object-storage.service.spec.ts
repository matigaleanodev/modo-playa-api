import { Readable } from 'stream';
import { NoopObjectStorageService } from './noop-object-storage.service';

describe('NoopObjectStorageService', () => {
  let service: NoopObjectStorageService;

  beforeEach(() => {
    service = new NoopObjectStorageService();
  });

  it('debe rechazar createSignedPutUrl', async () => {
    await expect(
      service.createSignedPutUrl({
        key: 'a',
        contentType: 'image/jpeg',
      }),
    ).rejects.toThrow('ObjectStorageService no implementado');
  });

  it('debe devolver un stream vacío en getObjectStream', async () => {
    const result = await service.getObjectStream('a');
    const chunks: Buffer[] = [];

    for await (const chunk of result.stream as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }

    expect(result.stream).toBeInstanceOf(Readable);
    expect(Buffer.concat(chunks).length).toBe(0);
  });

  it('debe rechazar headObject, objectExists, putObject y deleteObject', async () => {
    await expect(service.headObject('a')).rejects.toThrow();
    await expect(service.objectExists('a')).rejects.toThrow();
    await expect(
      service.putObject({
        key: 'a',
        body: Readable.from([]),
        contentType: 'text/plain',
      }),
    ).rejects.toThrow();
    await expect(service.deleteObject('a')).rejects.toThrow();
  });
});
