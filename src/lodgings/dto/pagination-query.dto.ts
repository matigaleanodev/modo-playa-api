import { LodgingAmenity } from '@lodgings/enums/amenities.enum';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  MaxLength,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  transformBooleanQuery,
  transformClampedIntQuery,
} from '@common/utils/query-transformers.util';

const trimStringArrayQuery = ({ value }: { value: unknown }): unknown => {
  if (!Array.isArray(value)) {
    return value;
  }

  return (value as unknown[]).map((item: unknown) =>
    typeof item === 'string' ? item.trim() : item,
  );
};

export class PublicLodgingsQueryDto {
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

  @ApiPropertyOptional({ example: 'mar azul' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    example: ['familia', 'frente_al_mar'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  @Transform(trimStringArrayQuery)
  tag?: string[];

  @ApiPropertyOptional({ example: 'Mar Azul' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(80)
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
  @Transform(trimStringArrayQuery)
  amenities?: LodgingAmenity[];
}

export class AdminLodgingsQueryDto extends PublicLodgingsQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(transformBooleanQuery)
  @IsBoolean()
  includeInactive?: boolean = true;
}
