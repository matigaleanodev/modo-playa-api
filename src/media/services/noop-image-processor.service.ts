import { Injectable } from '@nestjs/common';
import {
  ImageProcessorService,
  ImageProcessorTransformHandle,
} from '@media/interfaces/image-processor.interface';
import { PassThrough } from 'stream';

@Injectable()
export class NoopImageProcessorService implements ImageProcessorService {
  createLodgingNormalizerTransform(): ImageProcessorTransformHandle {
    const transform = new PassThrough();

    return {
      transform,
      getMetadata() {
        return Promise.reject(
          new Error('ImageProcessorService no implementado'),
        );
      },
    };
  }
}
