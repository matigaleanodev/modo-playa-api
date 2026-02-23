import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import {
  transformBooleanQuery,
  transformClampedIntQuery,
} from '@common/utils/query-transformers.util';

export class ContactsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Transform(transformClampedIntQuery({ min: 1, max: 50 }))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(transformBooleanQuery)
  @IsBoolean()
  includeInactive?: boolean = false;
}
