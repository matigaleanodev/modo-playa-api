import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UsersService } from '@users/users.service';
import { ActivateDto, ForgotPasswordDto } from './dto/activate.dto';
import { LoginDto } from './dto/login.dto';

import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RequestUser } from './interfaces/request-user.interface';
import { AuthResponse } from './interfaces/auth-response.interface';

import { UserDocument } from '@users/schemas/user.schema';

import { AuthException } from '@common/exceptions/auth.exception';
import { ERROR_CODES } from '@common/constants/error-code';
import { SetPasswordDto } from './interfaces/set-password.interface';
import { AuthUserResponse } from './interfaces/auth-user.interface';
import { ChangePasswordDto } from './dto/chage-password.dto';
import { VerifyResetCodeDto } from './dto/verifiy-reset-code.dto';
import { MailService } from '@mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async activate(dto: ActivateDto): Promise<{ accessToken: string }> {
    const identifier = dto.identifier.toLowerCase();

    const user = identifier.includes('@')
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findByUsername(identifier);

    if (!user) {
      throw new AuthException('User not found', ERROR_CODES.USER_NOT_FOUND);
    }

    if (!user.isActive) {
      throw new AuthException('User disabled', ERROR_CODES.USER_DISABLED);
    }

    if (user.isPasswordSet) {
      throw new AuthException(
        'Password already set',
        ERROR_CODES.PASSWORD_ALREADY_SET,
      );
    }

    const role = this.resolveUserRole(user);

    const payload: JwtPayload = {
      sub: user._id.toString(),
      ownerId: user.ownerId.toString(),
      role,
      purpose: 'PASSWORD_SETUP',
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '30m',
    });

    return {
      accessToken: token,
    };
  }

  async setPassword(
    user: RequestUser,
    dto: SetPasswordDto,
  ): Promise<AuthResponse> {
    if (user.purpose !== 'PASSWORD_SETUP') {
      throw new AuthException(
        'Invalid token purpose',
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }

    const dbUser = await this.usersService.findById(user.ownerId, user.userId);

    if (!dbUser) {
      throw new AuthException('User not found', ERROR_CODES.USER_NOT_FOUND);
    }

    if (!dbUser.isActive) {
      throw new AuthException('User disabled', ERROR_CODES.USER_DISABLED);
    }

    if (dbUser.isPasswordSet) {
      throw new AuthException(
        'Password already set',
        ERROR_CODES.PASSWORD_ALREADY_SET,
      );
    }

    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    await this.usersService.setPassword(
      user.ownerId,
      user.userId,
      passwordHash,
    );

    const role = this.resolveUserRole(dbUser);

    const payload: JwtPayload = {
      sub: dbUser._id.toString(),
      ownerId: dbUser.ownerId.toString(),
      role,
      purpose: 'ACCESS',
    };

    const refreshPayload: JwtPayload = {
      ...payload,
      purpose: 'REFRESH',
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '3d',
    });

    return this.buildAuthResponse(dbUser, accessToken, refreshToken);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const identifier = dto.identifier.toLowerCase();

    const user = identifier.includes('@')
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findByUsername(identifier);

    if (!user) {
      throw new AuthException(
        'Invalid credentials',
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }

    if (!user.isActive) {
      throw new AuthException('User disabled', ERROR_CODES.USER_DISABLED);
    }

    if (!user.isPasswordSet || !user.passwordHash) {
      throw new AuthException(
        'Invalid credentials',
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new AuthException(
        'Invalid credentials',
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }

    const role = this.resolveUserRole(user);

    const payload: JwtPayload = {
      sub: user._id.toString(),
      ownerId: user.ownerId.toString(),
      role,
      purpose: 'ACCESS',
    };

    const refreshPayload: JwtPayload = {
      ...payload,
      purpose: 'REFRESH',
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '3d',
    });

    return this.buildAuthResponse(user, accessToken, refreshToken);
  }

  async refresh(user: RequestUser): Promise<AuthResponse> {
    if (user.purpose !== 'REFRESH') {
      throw new AuthException(
        'Invalid token purpose',
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }

    const dbUser = await this.usersService.findById(user.ownerId, user.userId);

    if (!dbUser) {
      throw new AuthException(
        'Invalid credentials',
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }

    if (!dbUser.isActive) {
      throw new AuthException('User disabled', ERROR_CODES.USER_DISABLED);
    }

    const role = this.resolveUserRole(dbUser);

    const accessPayload: JwtPayload = {
      sub: dbUser._id.toString(),
      ownerId: dbUser.ownerId.toString(),
      role,
      purpose: 'ACCESS',
    };

    const refreshPayload: JwtPayload = {
      sub: dbUser._id.toString(),
      ownerId: dbUser.ownerId.toString(),
      role,
      purpose: 'REFRESH',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '3d',
    });

    return this.buildAuthResponse(dbUser, accessToken, refreshToken);
  }

  async changePassword(
    user: RequestUser,
    dto: ChangePasswordDto,
  ): Promise<AuthResponse> {
    if (user.purpose !== 'ACCESS') {
      throw new AuthException(
        'Invalid token purpose',
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }

    const dbUser = await this.usersService.findById(user.ownerId, user.userId);

    if (!dbUser) {
      throw new AuthException(
        'Invalid credentials',
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }

    if (!dbUser.isActive) {
      throw new AuthException('User disabled', ERROR_CODES.USER_DISABLED);
    }

    if (!dbUser.passwordHash) {
      throw new AuthException(
        'Invalid credentials',
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      dbUser.passwordHash,
    );

    if (!isPasswordValid) {
      throw new AuthException(
        'Invalid credentials',
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }

    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const newPasswordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.usersService.setPassword(
      user.ownerId,
      user.userId,
      newPasswordHash,
    );

    const role = this.resolveUserRole(dbUser);

    const accessPayload: JwtPayload = {
      sub: dbUser._id.toString(),
      ownerId: dbUser.ownerId.toString(),
      role,
      purpose: 'ACCESS',
    };

    const refreshPayload: JwtPayload = {
      ...accessPayload,
      purpose: 'REFRESH',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '3d',
    });

    return this.buildAuthResponse(dbUser, accessToken, refreshToken);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const identifier = dto.identifier.toLowerCase();

    const user = identifier.includes('@')
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findByUsername(identifier);

    if (user) {
      const code = this.generateSixDigitCode();

      const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
      const codeHash = await bcrypt.hash(code, saltRounds);

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await this.usersService.setResetPasswordData(
        user._id.toString(),
        codeHash,
        expiresAt,
      );
      try {
        await this.mailService.sendResetCode(user.email, code);
      } catch (error) {
        console.error('Mail error:', error);
      }
    }

    return {
      message: 'If the user exists, a verification code has been sent.',
    };
  }

  async verifyResetCode(
    dto: VerifyResetCodeDto,
  ): Promise<{ accessToken: string }> {
    const identifier = dto.identifier.toLowerCase();

    const user = identifier.includes('@')
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findByUsername(identifier);

    if (!user || !user.resetPasswordCodeHash || !user.resetPasswordExpiresAt) {
      throw new AuthException('Invalid code', ERROR_CODES.INVALID_CREDENTIALS);
    }

    if (user.resetPasswordExpiresAt.getTime() < Date.now()) {
      throw new AuthException('Code expired', ERROR_CODES.INVALID_CREDENTIALS);
    }

    if (user.resetPasswordAttempts >= 5) {
      throw new AuthException(
        'Too many attempts',
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }

    const isCodeValid = await bcrypt.compare(
      dto.code,
      user.resetPasswordCodeHash,
    );

    if (!isCodeValid) {
      await this.usersService.incrementResetAttempts(user._id.toString());

      throw new AuthException('Invalid code', ERROR_CODES.INVALID_CREDENTIALS);
    }

    await this.usersService.clearResetData(user._id.toString());

    const role = this.resolveUserRole(user);

    const payload: JwtPayload = {
      sub: user._id.toString(),
      ownerId: user.ownerId.toString(),
      role,
      purpose: 'PASSWORD_SETUP',
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    return {
      accessToken: token,
    };
  }

  async resetPassword(
    user: RequestUser,
    dto: SetPasswordDto,
  ): Promise<{ message: string }> {
    if (user.purpose !== 'PASSWORD_SETUP') {
      throw new AuthException(
        'Invalid token purpose',
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }

    const dbUser = await this.usersService.findById(user.ownerId, user.userId);

    if (!dbUser || !dbUser.isActive) {
      throw new AuthException(
        'Invalid credentials',
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }

    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    await this.usersService.setPassword(
      user.ownerId,
      user.userId,
      passwordHash,
    );

    try {
      await this.mailService.sendPasswordChanged(dbUser.email);
    } catch (error) {
      console.error('Mail error:', error);
    }

    return {
      message: 'Password updated successfully. Please login.',
    };
  }

  private buildAuthResponse(
    user: UserDocument,
    accessToken: string,
    refreshToken: string,
  ): AuthResponse {
    const role = this.resolveUserRole(user);

    const authUser: AuthUserResponse = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role,
    };

    return {
      accessToken,
      refreshToken,
      user: authUser,
    };
  }

  async me(user: RequestUser): Promise<AuthUserResponse> {
    const dbUser = await this.usersService.findById(user.ownerId, user.userId);

    const role = this.resolveUserRole(dbUser);

    return {
      id: dbUser._id.toString(),
      email: dbUser.email,
      username: dbUser.username,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      displayName: dbUser.displayName,
      avatarUrl: dbUser.avatarUrl,
      role,
    };
  }

  private resolveUserRole(user: UserDocument): 'OWNER' | 'SUPERADMIN' {
    const superadminId = this.configService.get<string>('SUPERADMIN_ID');

    if (superadminId && user._id.toString() === superadminId) {
      return 'SUPERADMIN';
    }

    return 'OWNER';
  }

  private generateSixDigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
