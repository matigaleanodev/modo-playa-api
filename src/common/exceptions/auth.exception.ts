import { ErrorCode } from '@common/constants/error-code';
import { DomainException } from './domain.exception';
import { HttpStatus } from '@nestjs/common';

export class AuthException extends DomainException {
  constructor(message: string, code: ErrorCode) {
    super(message, code, HttpStatus.UNAUTHORIZED);
  }
}
