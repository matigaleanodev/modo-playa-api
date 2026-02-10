import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-code';

interface DomainErrorResponse {
  message: string;
  code: ErrorCode;
}

export class DomainException extends HttpException {
  constructor(
    message: string,
    code: ErrorCode,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    const response: DomainErrorResponse = {
      message,
      code,
    };

    super(response, status);
  }
}
