import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class RequestDraftLodgingImageUploadUrlDto {
  @ApiProperty({
    example: 'draft-lodging-01',
    description: 'Identificador estable del flujo de creacion del alojamiento.',
  })
  @IsString()
  uploadSessionId!: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  mime!: string;

  @ApiProperty({ example: 245678 })
  @IsNumber()
  @Min(1)
  size!: number;
}
