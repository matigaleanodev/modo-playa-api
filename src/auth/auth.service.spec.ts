import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '@users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '@mail/mail.service';
import { AuthException } from '@common/exceptions/auth.exception';
import { MEDIA_URL_BUILDER } from '@media/constants/media.tokens';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    findById: jest.fn(),
    setPassword: jest.fn(),
    setResetPasswordData: jest.fn(),
    incrementResetAttempts: jest.fn(),
    clearResetData: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'BCRYPT_ROUNDS') return 10;
      if (key === 'SUPERADMIN_ID') return null;
      return null;
    }),
  };

  const mockMailService: Pick<
    MailService,
    'sendResetCode' | 'sendPasswordChanged'
  > = {
    sendResetCode: jest.fn(),
    sendPasswordChanged: jest.fn(),
  };

  const mockMediaUrlBuilder = {
    buildPublicUrl: jest.fn((key: string) => `https://media.test/${key}`),
    buildLodgingVariants: jest.fn((key: string) => ({
      thumb: `https://media.test/thumb/${key}`,
      card: `https://media.test/card/${key}`,
      hero: `https://media.test/hero/${key}`,
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
        { provide: MEDIA_URL_BUILDER, useValue: mockMediaUrlBuilder },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // LOGIN
  // -----------------------------

  it('debe hacer login correctamente', async () => {
    const user = {
      _id: 'id1',
      ownerId: 'owner1',
      email: 'test@test.com',
      username: 'test',
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User',
      avatarUrl: '',
      isActive: true,
      isPasswordSet: true,
      passwordHash: 'hashed',
    };

    mockUsersService.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      identifier: 'test@test.com',
      password: '1234',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('debe lanzar error si credenciales inválidas', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ identifier: 'x@test.com', password: '1234' }),
    ).rejects.toThrow(AuthException);
  });

  // -----------------------------
  // FORGOT PASSWORD
  // -----------------------------

  it('debe enviar mail si usuario existe', async () => {
    const user = {
      _id: 'id1',
      email: 'test@test.com',
    };

    mockUsersService.findByEmail.mockResolvedValue(user);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    await service.forgotPassword({ identifier: 'test@test.com' });

    expect(mockMailService.sendResetCode).toHaveBeenCalled();
  });

  // -----------------------------
  // CHANGE PASSWORD
  // -----------------------------

  it('debe lanzar error si contraseña actual es incorrecta', async () => {
    const dbUser = {
      _id: 'id1',
      ownerId: 'owner1',
      isActive: true,
      passwordHash: 'hash',
    };

    mockUsersService.findById.mockResolvedValue(dbUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.changePassword(
        { ownerId: 'owner1', userId: 'id1', role: 'OWNER', purpose: 'ACCESS' },
        { currentPassword: 'wrong', newPassword: 'new' },
      ),
    ).rejects.toThrow(AuthException);
  });

  // -----------------------------
  // REFRESH
  // -----------------------------

  it('debe generar nuevos tokens en refresh', async () => {
    const dbUser = {
      _id: 'id1',
      ownerId: 'owner1',
      email: '',
      username: '',
      firstName: '',
      lastName: '',
      displayName: '',
      avatarUrl: '',
      isActive: true,
    };

    mockUsersService.findById.mockResolvedValue(dbUser);

    const result = await service.refresh({
      ownerId: 'owner1',
      userId: 'id1',
      role: 'OWNER',
      purpose: 'REFRESH',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('debe devolver avatarUrl y profileImage en me cuando existe imagen de perfil', async () => {
    mockUsersService.findById.mockResolvedValue({
      _id: 'id1',
      ownerId: 'owner1',
      email: 'test@test.com',
      username: 'test',
      avatarUrl: null,
      phone: '123',
      profileImage: {
        imageId: 'img1',
        key: 'users/id1/profile/img1/original.webp',
        width: 100,
        height: 100,
        bytes: 1000,
        mime: 'image/webp',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    });

    const result = await service.me({
      ownerId: 'owner1',
      userId: 'id1',
      role: 'OWNER',
      purpose: 'ACCESS',
    });

    expect(result.avatarUrl).toContain('https://media.test/');
    expect(result.profileImage?.imageId).toBe('img1');
    expect(result.phone).toBe('123');
  });

  it('debe actualizar perfil propio con updateMe', async () => {
    mockUsersService.updateUser = jest.fn().mockResolvedValue({
      _id: 'id1',
      ownerId: 'owner1',
      email: 'test@test.com',
      username: 'test',
      firstName: 'Juan',
      lastName: 'Perez',
      displayName: 'Juan Perez',
      phone: '123',
      avatarUrl: null,
    });

    const result = await service.updateMe(
      {
        ownerId: 'owner1',
        userId: 'id1',
        role: 'OWNER',
        purpose: 'ACCESS',
      },
      {
        firstName: 'Juan',
      },
    );

    expect(mockUsersService.updateUser).toHaveBeenCalledWith('owner1', 'id1', {
      firstName: 'Juan',
    });
    expect(result.firstName).toBe('Juan');
  });
});
