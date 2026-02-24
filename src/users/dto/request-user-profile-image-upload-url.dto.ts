import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class RequestUserProfileImageUploadUrlDto {
  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  mime!: string;

  @ApiProperty({ example: 3145728 })
  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  size!: number;

  @ApiPropertyOptional({ example: 'perfil.jpg' })
  @IsOptional()
  @IsString()
  originalFilename?: string;
}
