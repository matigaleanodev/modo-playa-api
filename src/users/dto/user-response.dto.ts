import { ApiProperty } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserProfileImageResponseDto } from './user-profile-image-response.dto';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  isPasswordSet!: boolean;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ required: false })
  lastLoginAt?: Date;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty({ required: false })
  displayName?: string;

  @ApiProperty({ required: false })
  avatarUrl?: string;

  @ApiPropertyOptional({ type: UserProfileImageResponseDto })
  profileImage?: UserProfileImageResponseDto;

  @ApiProperty({ required: false })
  phone?: string;
}
