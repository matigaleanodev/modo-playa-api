import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  authUserProfileImageExample,
  authUserResponseExample,
} from '../../swagger/examples/auth.examples';

class AuthUserProfileImageVariantsResponseDto {
  @ApiProperty()
  thumb!: string;

  @ApiProperty()
  card!: string;

  @ApiProperty()
  hero!: string;
}

export class AuthUserProfileImageResponseDto {
  @ApiProperty({ example: authUserProfileImageExample.imageId })
  imageId!: string;

  @ApiProperty({ example: authUserProfileImageExample.key })
  key!: string;

  @ApiPropertyOptional({ example: authUserProfileImageExample.width })
  width?: number;

  @ApiPropertyOptional({ example: authUserProfileImageExample.height })
  height?: number;

  @ApiPropertyOptional({ example: authUserProfileImageExample.bytes })
  bytes?: number;

  @ApiPropertyOptional({ example: authUserProfileImageExample.mime })
  mime?: string;

  @ApiProperty({ example: authUserProfileImageExample.createdAt })
  createdAt!: string;

  @ApiProperty({ example: authUserProfileImageExample.url })
  url!: string;

  @ApiPropertyOptional({
    type: AuthUserProfileImageVariantsResponseDto,
    example: authUserProfileImageExample.variants,
  })
  variants?: AuthUserProfileImageVariantsResponseDto;
}

export class AuthUserResponseDto {
  @ApiProperty({ example: authUserResponseExample.id })
  id!: string;

  @ApiProperty({ example: authUserResponseExample.email })
  email!: string;

  @ApiProperty({ example: authUserResponseExample.username })
  username!: string;

  @ApiPropertyOptional({ example: authUserResponseExample.firstName })
  firstName?: string;

  @ApiPropertyOptional({ example: authUserResponseExample.lastName })
  lastName?: string;

  @ApiPropertyOptional({ example: authUserResponseExample.displayName })
  displayName?: string;

  @ApiPropertyOptional({ example: authUserResponseExample.avatarUrl })
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    type: AuthUserProfileImageResponseDto,
    example: authUserResponseExample.profileImage,
  })
  profileImage?: AuthUserProfileImageResponseDto;

  @ApiPropertyOptional({ example: authUserResponseExample.phone })
  phone?: string;

  @ApiProperty({ example: authUserResponseExample.role })
  role!: 'OWNER' | 'SUPERADMIN';
}
