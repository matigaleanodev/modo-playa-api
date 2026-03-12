import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConfirmDraftLodgingImageDto {
  @ApiProperty({ example: 'draft-lodging-01' })
  @IsString()
  uploadSessionId!: string;

  @ApiProperty({ example: '8d0eceb4-c871-4510-aa3b-fdbba4070030' })
  @IsString()
  imageId!: string;
}
