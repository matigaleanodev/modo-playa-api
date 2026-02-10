import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-code';

export class DomainException extends HttpException {
  constructor(
    message: string,
    code: ErrorCode,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        message,
        code,
      },
      status,
    );
  }
}
