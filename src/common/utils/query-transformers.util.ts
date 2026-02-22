import { TransformFnParams } from 'class-transformer';

export function parseBooleanQueryValue(value: unknown): unknown {
  if (typeof value === 'boolean' || value === undefined || value === null) {
    return value;
  }

  let raw: unknown = value;

  if (Array.isArray(value)) {
    const arrayValue = value as unknown[];
    raw = arrayValue[0];
  }

  if (typeof raw !== 'string') {
    return value;
  }

  const normalized = raw.trim().toLowerCase();

  if (normalized === 'true' || normalized === '1') {
    return true;
  }

  if (normalized === 'false' || normalized === '0') {
    return false;
  }

  return value;
}

export function transformBooleanQuery({ value }: TransformFnParams): unknown {
  return parseBooleanQueryValue(value);
}
