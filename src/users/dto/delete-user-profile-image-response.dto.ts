import { ApiProperty } from '@nestjs/swagger';

export class DeleteUserProfileImageResponseDto {
  @ApiProperty()
  deleted!: boolean;
}
