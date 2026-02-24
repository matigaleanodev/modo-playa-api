import { ConfigService } from '@nestjs/config';
import { R2HealthService } from './r2-health.service';

describe('R2HealthService', () => {
  const createService = () => {
    const configService = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          R2_ENDPOINT: 'https://example.r2.cloudflarestorage.com',
          R2_ACCESS_KEY_ID: 'key',
          R2_SECRET_ACCESS_KEY: 'secret',
          R2_BUCKET: 'bucket',
          R2_REGION: 'auto',
        };
        return map[key];
      }),
    } as unknown as ConfigService;

    const service = new R2HealthService(configService);
    return { service, configService };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debe retornar ok=true cuando HeadBucket responde correctamente', async () => {
    const { service } = createService();
    const sendSpy = jest
      .spyOn(
        (
          service as unknown as {
            client: { send: (...args: unknown[]) => Promise<unknown> };
          }
        ).client,
        'send',
      )
      .mockResolvedValue({});
    const loggerLogSpy = jest
      .spyOn(
        (service as unknown as { logger: { log: (msg: string) => void } })
          .logger,
        'log',
      )
      .mockImplementation(() => undefined);

    const result = await service.testConnection();

    expect(sendSpy).toHaveBeenCalled();
    expect(loggerLogSpy).toHaveBeenCalledWith('Connecting to R2...');
    expect(loggerLogSpy).toHaveBeenCalledWith('Bucket access OK');
    expect(result).toEqual({
      ok: true,
      message: 'R2 connection successful',
    });
  });

  it('debe retornar ok=false cuando HeadBucket falla', async () => {
    const { service } = createService();
    jest
      .spyOn(
        (
          service as unknown as {
            client: { send: (...args: unknown[]) => Promise<unknown> };
          }
        ).client,
        'send',
      )
      .mockRejectedValue(new Error('forbidden'));
    const errorSpy = jest
      .spyOn(
        (service as unknown as { logger: { error: (msg: string) => void } })
          .logger,
        'error',
      )
      .mockImplementation(() => undefined);

    const result = await service.testConnection();

    expect(errorSpy).toHaveBeenCalledWith('R2 connection failed: forbidden');
    expect(result).toEqual({
      ok: false,
      message: 'R2 connection failed: forbidden',
    });
  });

  it('debe subir y borrar el objeto de healthcheck en testPutObject', async () => {
    const { service } = createService();
    const sendSpy = jest
      .spyOn(
        (
          service as unknown as {
            client: { send: (...args: unknown[]) => Promise<unknown> };
          }
        ).client,
        'send',
      )
      .mockResolvedValue({});
    const loggerLogSpy = jest
      .spyOn(
        (service as unknown as { logger: { log: (msg: string) => void } })
          .logger,
        'log',
      )
      .mockImplementation(() => undefined);

    await service.testPutObject();

    expect(sendSpy).toHaveBeenCalledTimes(2);
    expect(loggerLogSpy).toHaveBeenCalledWith('Connecting to R2...');
    expect(loggerLogSpy).toHaveBeenCalledWith('Upload test OK');
  });
});
