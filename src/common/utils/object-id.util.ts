import { DomainException } from '@common/exceptions/domain.exception';
import { Types } from 'mongoose';

type ObjectIdErrorConfig = {
  message: string;
  errorCode: string;
  httpStatus: number;
};

export function toObjectIdOrThrow(
  value: string,
  config: ObjectIdErrorConfig,
): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new DomainException(
      config.message,
      config.errorCode,
      config.httpStatus,
    );
  }

  return new Types.ObjectId(value);
}
