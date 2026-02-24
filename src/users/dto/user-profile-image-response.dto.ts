import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileImageVariantsResponseDto {
  @ApiProperty()
  thumb!: string;

  @ApiProperty()
  card!: string;

  @ApiProperty()
  hero!: string;
}

export class UserProfileImageResponseDto {
  @ApiProperty()
  imageId!: string;

  @ApiProperty()
  key!: string;

  @ApiPropertyOptional()
  width?: number;

  @ApiPropertyOptional()
  height?: number;

  @ApiPropertyOptional()
  bytes?: number;

  @ApiPropertyOptional()
  mime?: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  url!: string;

  @ApiPropertyOptional({ type: UserProfileImageVariantsResponseDto })
  variants?: UserProfileImageVariantsResponseDto;
}
