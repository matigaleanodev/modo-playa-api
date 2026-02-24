import { NoopImageProcessorService } from './noop-image-processor.service';

describe('NoopImageProcessorService', () => {
  let service: NoopImageProcessorService;

  beforeEach(() => {
    service = new NoopImageProcessorService();
  });

  it('debe devolver un transform y fallar al pedir metadata', async () => {
    const handle = service.createLodgingNormalizerTransform({
      maxWidth: 100,
      maxHeight: 100,
      outputFormat: 'webp',
    });

    expect(handle.transform).toBeDefined();
    await expect(handle.getMetadata()).rejects.toThrow(
      'ImageProcessorService no implementado',
    );
  });
});
