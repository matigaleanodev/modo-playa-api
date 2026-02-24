import { ApiProperty } from '@nestjs/swagger';

export class UserProfileImageUploadUrlResponseDto {
  @ApiProperty()
  imageId!: string;

  @ApiProperty()
  uploadKey!: string;

  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty({ example: 'PUT' })
  method!: 'PUT';

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  requiredHeaders!: Record<string, string>;

  @ApiProperty()
  expiresInSeconds!: number;
}
