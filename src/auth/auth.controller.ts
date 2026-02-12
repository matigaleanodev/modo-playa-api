import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { ActivateDto, ForgotPasswordDto } from './dto/activate.dto';
import { RequestUser } from './interfaces/request-user.interface';
import { SetPasswordDto } from './interfaces/set-password.interface';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guard/auth.guard';
import { ChangePasswordDto } from './dto/chage-password.dto';
import { VerifyResetCodeDto } from './dto/verifiy-reset-code.dto';

import {
  AUTH_TOKEN_RESPONSE_EXAMPLE,
  AUTH_LOGIN_RESPONSE_EXAMPLE,
  FORGOT_PASSWORD_RESPONSE_EXAMPLE,
  RESET_PASSWORD_RESPONSE_EXAMPLE,
} from './swagger/auth.swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({
    summary: 'Activar usuario',
    description:
      'Genera un token temporal para que el usuario configure su contraseña.',
  })
  @ApiBody({ type: ActivateDto })
  @ApiResponse({
    status: 201,
    description: 'Token generado correctamente',
    schema: { example: AUTH_TOKEN_RESPONSE_EXAMPLE },
  })
  @Post('activate')
  activate(@Body() dto: ActivateDto) {
    return this.authService.activate(dto);
  }

  @ApiOperation({
    summary: 'Configurar contraseña inicial',
  })
  @ApiBody({ type: SetPasswordDto })
  @ApiResponse({
    status: 201,
    description: 'Login automático tras setear contraseña',
    schema: { example: AUTH_LOGIN_RESPONSE_EXAMPLE },
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('set-password')
  setPassword(
    @Request() req: { user: RequestUser },
    @Body() dto: SetPasswordDto,
  ) {
    return this.authService.setPassword(req.user, dto);
  }

  @ApiOperation({
    summary: 'Login de usuario',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Login exitoso',
    schema: { example: AUTH_LOGIN_RESPONSE_EXAMPLE },
  })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({
    summary: 'Refrescar tokens',
  })
  @ApiResponse({
    status: 201,
    description: 'Tokens renovados',
    schema: { example: AUTH_LOGIN_RESPONSE_EXAMPLE },
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  refresh(@Request() req: { user: RequestUser }) {
    return this.authService.refresh(req.user);
  }

  @ApiOperation({
    summary: 'Cambiar contraseña',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 201,
    description: 'Contraseña actualizada y tokens renovados',
    schema: { example: AUTH_LOGIN_RESPONSE_EXAMPLE },
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @Request() req: { user: RequestUser },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user, dto);
  }

  @ApiOperation({
    summary: 'Solicitar código de recuperación',
    description:
      'Envía un código de recuperación al email si el usuario existe.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 201,
    description: 'Mensaje genérico por seguridad',
    schema: { example: FORGOT_PASSWORD_RESPONSE_EXAMPLE },
  })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({
    summary: 'Verificar código de recuperación',
  })
  @ApiBody({ type: VerifyResetCodeDto })
  @ApiResponse({
    status: 201,
    description: 'Token temporal para resetear contraseña',
    schema: { example: AUTH_TOKEN_RESPONSE_EXAMPLE },
  })
  @Post('verify-reset-code')
  verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(dto);
  }

  @ApiOperation({
    summary: 'Resetear contraseña',
  })
  @ApiBody({ type: SetPasswordDto })
  @ApiResponse({
    status: 201,
    description: 'Contraseña actualizada correctamente',
    schema: { example: RESET_PASSWORD_RESPONSE_EXAMPLE },
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('reset-password')
  resetPassword(
    @Request() req: { user: RequestUser },
    @Body() dto: SetPasswordDto,
  ) {
    return this.authService.resetPassword(req.user, dto);
  }
}
