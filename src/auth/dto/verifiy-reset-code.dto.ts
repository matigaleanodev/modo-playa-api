import { IsString, Length, MinLength } from 'class-validator';

export class VerifyResetCodeDto {
  @IsString()
  @MinLength(3)
  identifier!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}
