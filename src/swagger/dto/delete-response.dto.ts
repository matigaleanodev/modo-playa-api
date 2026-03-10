import { ApiProperty } from '@nestjs/swagger';

export class DeleteResponseDto {
  @ApiProperty()
  deleted!: boolean;
}
