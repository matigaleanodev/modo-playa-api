import { ApiProperty } from '@nestjs/swagger';
import { authLoginResponseExample } from '../../swagger/examples/auth.examples';
import { AuthUserResponseDto } from './auth-user-response.dto';

export class AuthResponseDto {
  @ApiProperty({ example: authLoginResponseExample.accessToken })
  accessToken!: string;

  @ApiProperty({ example: authLoginResponseExample.refreshToken })
  refreshToken!: string;

  @ApiProperty({
    type: AuthUserResponseDto,
    example: authLoginResponseExample.user,
  })
  user!: AuthUserResponseDto;
}
