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

export function parseClampedIntQueryValue(
  value: unknown,
  options: { min?: number; max?: number } = {},
): unknown {
  if (value === undefined || value === null) {
    return value;
  }

  let raw: unknown = value;
  if (Array.isArray(value)) {
    raw = value[0];
  }

  let parsed: unknown = raw;

  if (typeof raw === 'string') {
    const normalized = raw.trim();
    if (normalized.length === 0) {
      return raw;
    }
    parsed = Number(normalized);
  }

  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
    return parsed;
  }

  if (!Number.isInteger(parsed)) {
    return parsed;
  }

  const min = options.min;
  const max = options.max;

  if (typeof min === 'number' && parsed < min) {
    return parsed;
  }

  if (typeof max === 'number' && parsed > max) {
    return max;
  }

  return parsed;
}

export function transformClampedIntQuery(
  options: { min?: number; max?: number } = {},
) {
  return ({ value }: TransformFnParams): unknown =>
    parseClampedIntQueryValue(value, options);
}
