import { Injectable } from '@nestjs/common';
import sharp, { type OutputInfo, type Sharp } from 'sharp';
import type {
  ImageProcessorService,
  ImageProcessorTransformHandle,
} from '@media/interfaces/image-processor.interface';

@Injectable()
export class SharpImageProcessorService implements ImageProcessorService {
  createLodgingNormalizerTransform(input: {
    maxWidth: number;
    maxHeight: number;
    outputFormat: 'webp';
    quality?: number;
  }): ImageProcessorTransformHandle {
    const transformer: Sharp = sharp()
      .rotate()
      .resize({
        width: input.maxWidth,
        height: input.maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: input.quality ?? 82,
      });

    let bytes = 0;
    let outputInfo: OutputInfo | null = null;

    const metadataPromise = new Promise<{
      width: number;
      height: number;
      bytes?: number;
      mime: 'image/webp';
    }>((resolve, reject) => {
      transformer.once('info', (info: OutputInfo) => {
        outputInfo = info;
      });

      transformer.once('end', () => {
        if (!outputInfo) {
          reject(new Error('No se obtuvo metadata de salida de sharp'));
          return;
        }

        resolve({
          width: outputInfo.width,
          height: outputInfo.height,
          bytes,
          mime: 'image/webp',
        });
      });

      transformer.once('error', (error) => {
        reject(error);
      });
    });

    transformer.on('data', (chunk: Buffer) => {
      bytes += chunk.length;
    });

    return {
      transform: transformer,
      async getMetadata() {
        return metadataPromise;
      },
    };
  }
}
