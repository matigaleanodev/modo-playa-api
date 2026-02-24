export interface ImageProcessorTransformHandle {
  transform: NodeJS.ReadWriteStream;
  getMetadata(): Promise<{
    width: number;
    height: number;
    bytes?: number;
    mime: 'image/webp';
  }>;
}

export interface ImageProcessorService {
  createLodgingNormalizerTransform(input: {
    maxWidth: number;
    maxHeight: number;
    outputFormat: 'webp';
    quality?: number;
  }): ImageProcessorTransformHandle;
}
