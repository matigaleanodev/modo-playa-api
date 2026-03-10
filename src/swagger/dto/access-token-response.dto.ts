import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenResponseDto {
  @ApiProperty()
  accessToken!: string;
}
