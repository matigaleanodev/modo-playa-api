import { IntersectionType } from '@nestjs/swagger';
import { AuthCodeDto } from './auth-code.dto';
import { AuthIdentifierDto } from './auth-identifier.dto';

export class AuthIdentifierCodeDto extends IntersectionType(
  AuthIdentifierDto,
  AuthCodeDto,
) {}
