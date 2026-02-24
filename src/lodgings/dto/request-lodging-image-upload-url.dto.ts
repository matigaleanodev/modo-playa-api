import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class RequestLodgingImageUploadUrlDto {
  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  mime!: string;

  @ApiProperty({ example: 5242880 })
  @IsInt()
  @Min(1)
  @Max(20 * 1024 * 1024)
  size!: number;

  @ApiPropertyOptional({ example: 'cabana-frente.jpg' })
  @IsOptional()
  @IsString()
  originalFilename?: string;
}
