import { IsString, MinLength } from 'class-validator';

export class ActivateDto {
  @IsString()
  @MinLength(3)
  identifier!: string; // username o email
}

export class ForgotPasswordDto extends ActivateDto {}
