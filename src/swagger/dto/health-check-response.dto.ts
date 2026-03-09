import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckResponseDto {
  @ApiProperty()
  ok!: boolean;

  @ApiProperty()
  message!: string;
}
