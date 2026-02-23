import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { transformClampedIntQuery } from '@common/utils/query-transformers.util';

export class UsersQueryDto {
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
}
