import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class UploadDraftLodgingImageFileDto {
  @ApiProperty({
    description: 'Sesion de upload del alta de lodging.',
    example: '9f2df09f-0d6e-4b55-8391-6e44e695d5d2',
  })
  @IsString()
  @IsUUID()
  uploadSessionId!: string;
}
