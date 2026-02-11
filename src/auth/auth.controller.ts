import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ActivateDto, ForgotPasswordDto } from './dto/activate.dto';
import { RequestUser } from './interfaces/request-user.interface';
import { SetPasswordDto } from './interfaces/set-password.interface';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guard/auth.guard';
import { ChangePasswordDto } from './dto/chage-password.dto';
import { VerifyResetCodeDto } from './dto/verifiy-reset-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('activate')
  activate(@Body() dto: ActivateDto) {
    return this.authService.activate(dto);
  }

  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  setPassword(
    @Request() req: { user: RequestUser },
    @Body() dto: SetPasswordDto,
  ) {
    return this.authService.setPassword(req.user, dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  refresh(@Request() req: { user: RequestUser }) {
    return this.authService.refresh(req.user);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Request() req: { user: RequestUser },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user, dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-reset-code')
  verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(dto);
  }

  @Post('reset-password')
  @UseGuards(JwtAuthGuard)
  resetPassword(
    @Request() req: { user: RequestUser },
    @Body() dto: SetPasswordDto,
  ) {
    return this.authService.resetPassword(req.user, dto);
  }
}
