import { LodgingAmenity } from '@lodgings/enums/amenities.enum';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { transformBooleanQuery } from '@common/utils/query-transformers.util';

export class PublicLodgingsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'mar azul' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: ['familia', 'frente_al_mar'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  tag?: string[];

  @ApiPropertyOptional({ example: 'Mar Azul' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minGuests?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 120000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    enum: LodgingAmenity,
    isArray: true,
    example: ['wifi', 'pool'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(LodgingAmenity, { each: true })
  @Type(() => String)
  amenities?: LodgingAmenity[];
}

export class AdminLodgingsQueryDto extends PublicLodgingsQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(transformBooleanQuery)
  @IsBoolean()
  includeInactive?: boolean = true;
}
