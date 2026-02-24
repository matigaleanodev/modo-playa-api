import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RequestUser } from './interfaces/request-user.interface';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    activate: jest.fn(),
    setPassword: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    changePassword: jest.fn(),
    forgotPassword: jest.fn(),
    verifyResetCode: jest.fn(),
    resetPassword: jest.fn(),
    me: jest.fn(),
    updateMe: jest.fn(),
  };

  const mockUser: RequestUser = {
    userId: 'user1',
    ownerId: 'owner1',
    role: 'OWNER',
    purpose: 'ACCESS',
  };

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe delegar activate', async () => {
    mockAuthService.activate.mockResolvedValue({ accessToken: 'token' });

    const dto = { identifier: 'test@test.com' };

    const result = await controller.activate(dto);

    expect(mockAuthService.activate).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ accessToken: 'token' });
  });

  it('debe delegar login', async () => {
    mockAuthService.login.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'b',
    });

    const dto = { identifier: 'x', password: '1234' };

    const result = await controller.login(dto);

    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    expect(result).toBeDefined();
  });

  it('debe delegar setPassword', async () => {
    const dto = { password: '1234' };

    mockAuthService.setPassword.mockResolvedValue({});

    const result = await controller.setPassword(mockRequest, dto);

    expect(mockAuthService.setPassword).toHaveBeenCalledWith(mockUser, dto);

    expect(result).toEqual({});
  });

  it('debe delegar refresh', async () => {
    mockAuthService.refresh.mockResolvedValue({});

    const result = await controller.refresh(mockRequest);

    expect(mockAuthService.refresh).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual({});
  });

  it('debe delegar changePassword', async () => {
    const dto = { currentPassword: 'old', newPassword: 'new' };

    mockAuthService.changePassword.mockResolvedValue({});

    const result = await controller.changePassword(mockRequest, dto);

    expect(mockAuthService.changePassword).toHaveBeenCalledWith(mockUser, dto);

    expect(result).toEqual({});
  });

  it('debe delegar forgotPassword', async () => {
    const dto = { identifier: 'test@test.com' };

    mockAuthService.forgotPassword.mockResolvedValue({ message: 'ok' });

    const result = await controller.forgotPassword(dto);

    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ message: 'ok' });
  });

  it('debe delegar verifyResetCode', async () => {
    const dto = { identifier: 'test', code: '123456' };

    mockAuthService.verifyResetCode.mockResolvedValue({ accessToken: 'x' });

    const result = await controller.verifyResetCode(dto);

    expect(mockAuthService.verifyResetCode).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ accessToken: 'x' });
  });

  it('debe delegar resetPassword', async () => {
    const dto = { password: '1234' };

    mockAuthService.resetPassword.mockResolvedValue({ message: 'ok' });

    const result = await controller.resetPassword(mockRequest, dto);

    expect(mockAuthService.resetPassword).toHaveBeenCalledWith(mockUser, dto);

    expect(result).toEqual({ message: 'ok' });
  });

  it('debe delegar me', async () => {
    mockAuthService.me.mockResolvedValue({
      id: 'u1',
      email: 'a',
      username: 'b',
    });

    const result = await controller.me(mockRequest as { user: RequestUser });

    expect(mockAuthService.me).toHaveBeenCalledWith(mockUser);
    expect(result.id).toBe('u1');
  });

  it('debe delegar updateMe', async () => {
    const dto = { firstName: 'Juan' };
    mockAuthService.updateMe.mockResolvedValue({
      id: 'u1',
      email: 'a',
      username: 'b',
      firstName: 'Juan',
    });

    const result = await controller.updateMe(
      mockRequest as { user: RequestUser },
      dto,
    );

    expect(mockAuthService.updateMe).toHaveBeenCalledWith(mockUser, dto);
    expect(result.firstName).toBe('Juan');
  });
});
