import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ERROR_CODES, type ErrorCode } from '@common/constants/error-code';
import { DomainException } from '@common/exceptions/domain.exception';

type FirstConstraint = {
  property: string;
  constraint: string;
  message: string;
};

function findFirstConstraint(
  errors: ValidationError[],
): FirstConstraint | null {
  for (const error of errors) {
    if (error.constraints) {
      const [constraint, message] = Object.entries(error.constraints)[0] ?? [];

      if (constraint && message) {
        return {
          property: error.property,
          constraint,
          message,
        };
      }
    }

    if (error.children?.length) {
      const childConstraint = findFirstConstraint(error.children);

      if (childConstraint) {
        return childConstraint;
      }
    }
  }

  return null;
}

function resolveValidationErrorCode(error: FirstConstraint | null): ErrorCode {
  if (!error) {
    return ERROR_CODES.REQUEST_VALIDATION_ERROR;
  }

  if (error.property === 'id' && error.constraint === 'isEnum') {
    return ERROR_CODES.INVALID_DESTINATION_ID;
  }

  if (error.property === 'targetOwnerId' && error.constraint === 'isMongoId') {
    return ERROR_CODES.INVALID_TARGET_OWNER_ID;
  }

  if (error.property === 'contactId' && error.constraint === 'isMongoId') {
    return ERROR_CODES.INVALID_CONTACT_ID;
  }

  if (
    error.property === 'uploadSessionId' &&
    ['isString', 'isNotEmpty'].includes(error.constraint)
  ) {
    return ERROR_CODES.INVALID_UPLOAD_SESSION_ID;
  }

  if (error.property === 'mime' && error.constraint === 'isString') {
    return ERROR_CODES.INVALID_IMAGE_MIME;
  }

  if (
    error.property === 'size' &&
    ['isNumber', 'isInt', 'min', 'max'].includes(error.constraint)
  ) {
    return ERROR_CODES.INVALID_IMAGE_SIZE;
  }

  return ERROR_CODES.REQUEST_VALIDATION_ERROR;
}

export function createAppValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors: ValidationError[]) => {
      const firstConstraint = findFirstConstraint(errors);
      const message = firstConstraint?.message ?? 'Request validation failed';
      const code = resolveValidationErrorCode(firstConstraint);

      return new DomainException(message, code, HttpStatus.BAD_REQUEST);
    },
  });
}
