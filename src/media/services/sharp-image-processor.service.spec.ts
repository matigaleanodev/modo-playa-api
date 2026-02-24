import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { SharpImageProcessorService } from './sharp-image-processor.service';

describe('SharpImageProcessorService', () => {
  let service: SharpImageProcessorService;

  beforeEach(() => {
    service = new SharpImageProcessorService();
  });

  it('debe normalizar una imagen y devolver metadata en webp', async () => {
    const png1x1Base64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0YQAAAAASUVORK5CYII=';
    const input = Buffer.from(png1x1Base64, 'base64');

    const handle = service.createLodgingNormalizerTransform({
      maxWidth: 100,
      maxHeight: 100,
      outputFormat: 'webp',
    });

    const chunks: Buffer[] = [];
    handle.transform.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    await pipeline(
      Readable.from([input]),
      handle.transform as NodeJS.WritableStream,
    );
    const metadata = await handle.getMetadata();

    expect(chunks.length).toBeGreaterThan(0);
    expect(metadata.mime).toBe('image/webp');
    expect(metadata.width).toBeGreaterThan(0);
    expect(metadata.height).toBeGreaterThan(0);
    expect(metadata.bytes).toBeGreaterThan(0);
  });
});
