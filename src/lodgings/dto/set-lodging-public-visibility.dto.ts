import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetLodgingPublicVisibilityDto {
  @ApiProperty({
    example: true,
    description:
      'Determina si el alojamiento se expone en los endpoints publicos.',
  })
  @IsBoolean()
  isPubliclyVisible!: boolean;
}
