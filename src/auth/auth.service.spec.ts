import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '@users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '@mail/mail.service';
import { AuthException } from '@common/exceptions/auth.exception';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
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
});
