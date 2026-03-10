import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<TItem> {
  @ApiProperty({ isArray: true })
  data!: TItem[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
