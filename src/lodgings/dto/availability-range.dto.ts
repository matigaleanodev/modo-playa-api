import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AvailabilityRangeDto {
  @ApiProperty({
    example: '2026-01-10',
    description: 'Fecha de inicio del período ocupado (formato YYYY-MM-DD)',
  })
  @IsDateString()
  from!: string;

  @ApiProperty({
    example: '2026-01-20',
    description: 'Fecha de fin del período ocupado (formato YYYY-MM-DD)',
  })
  @IsDateString()
  to!: string;
}
