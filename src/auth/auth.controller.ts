import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { ActivateDto } from './dto/activate.dto';
import { RequestUser } from './interfaces/request-user.interface';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guard/auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { AuthIdentifierDto } from './dto/auth-identifier.dto';
import { MessageResponseDto } from '../swagger/dto/message-response.dto';
import { AccessTokenResponseDto } from '../swagger/dto/access-token-response.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { SetInitialPasswordDto } from './dto/set-initial-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  ApiActivateDoc,
  ApiAuthController,
  ApiChangePasswordDoc,
  ApiForgotPasswordDoc,
  ApiLoginDoc,
  ApiMeDoc,
  ApiRefreshDoc,
  ApiRequestActivationDoc,
  ApiResetPasswordDoc,
  ApiSetPasswordDoc,
  ApiUpdateMeDoc,
  ApiVerifyResetCodeDoc,
} from './swagger/auth.swagger';

@ApiAuthController()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiRequestActivationDoc()
  @Post('request-activation')
  async requestActivation(
    @Body() dto: AuthIdentifierDto,
  ): Promise<MessageResponseDto> {
    await this.authService.requestActivation(dto.identifier);

    return {
      message: 'Si el usuario existe, se envio un codigo de activacion',
    };
  }

  @ApiActivateDoc()
  @Post('activate')
  activate(@Body() dto: ActivateDto): Promise<AccessTokenResponseDto> {
    return this.authService.activate(dto);
  }

  @ApiSetPasswordDoc()
  @UseGuards(JwtAuthGuard)
  @Post('set-password')
  setPassword(
    @Request() req: { user: RequestUser },
    @Body() dto: SetInitialPasswordDto,
  ): Promise<AuthResponseDto> {
    return this.authService.setPassword(req.user, dto);
  }

  @ApiLoginDoc()
  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @ApiRefreshDoc()
  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  refresh(@Request() req: { user: RequestUser }): Promise<AuthResponseDto> {
    return this.authService.refresh(req.user);
  }

  @ApiChangePasswordDoc()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @Request() req: { user: RequestUser },
    @Body() dto: ChangePasswordDto,
  ): Promise<AuthResponseDto> {
    return this.authService.changePassword(req.user, dto);
  }

  @ApiForgotPasswordDoc()
  @Post('forgot-password')
  forgotPassword(@Body() dto: AuthIdentifierDto): Promise<MessageResponseDto> {
    return this.authService.forgotPassword(dto);
  }

  @ApiVerifyResetCodeDoc()
  @Post('verify-reset-code')
  verifyResetCode(
    @Body() dto: VerifyResetCodeDto,
  ): Promise<AccessTokenResponseDto> {
    return this.authService.verifyResetCode(dto);
  }

  @ApiResetPasswordDoc()
  @UseGuards(JwtAuthGuard)
  @Post('reset-password')
  resetPassword(
    @Request() req: { user: RequestUser },
    @Body() dto: ResetPasswordDto,
  ): Promise<MessageResponseDto> {
    return this.authService.resetPassword(req.user, dto);
  }

  @ApiMeDoc()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: { user: RequestUser }): Promise<AuthUserResponseDto> {
    return this.authService.me(req.user);
  }

  @ApiUpdateMeDoc()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(
    @Request() req: { user: RequestUser },
    @Body() dto: UpdateMyProfileDto,
  ): Promise<AuthUserResponseDto> {
    return this.authService.updateMe(req.user, dto);
  }
}
