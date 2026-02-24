import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserProfileImageResponseDto } from './user-profile-image-response.dto';

export class ConfirmUserProfileImageResponseDto {
  @ApiProperty({ type: UserProfileImageResponseDto })
  image!: UserProfileImageResponseDto;

  @ApiPropertyOptional()
  idempotent?: boolean;
}
