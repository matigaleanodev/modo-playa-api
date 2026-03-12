import { ApiProperty } from '@nestjs/swagger';

export class ConfirmDraftLodgingImageResponseDto {
  @ApiProperty({ example: '8d0eceb4-c871-4510-aa3b-fdbba4070030' })
  imageId!: string;

  @ApiProperty({ example: 'draft-lodging-01' })
  uploadSessionId!: string;

  @ApiProperty({ example: true })
  confirmed!: boolean;

  @ApiProperty({ required: false, example: true })
  idempotent?: boolean;
}
