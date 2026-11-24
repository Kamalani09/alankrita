import { body, checkExact, matchedData, param, query, validationResult } from 'express-validator';
import { ApiError } from '../utils/http.js';

function safeInputKeys(input) {
  const pending = [{ value: input, depth: 0 }];
  while (pending.length) {
    const { value, depth } = pending.pop();
    if (!value || typeof value !== 'object') continue;
    if (depth > 8) return false;
    for (const [key, child] of Object.entries(value)) {
      if (/[.$\u0000]/.test(key) || ['__proto__', 'constructor', 'prototype'].includes(key)) return false;
      pending.push({ value: child, depth: depth + 1 });
    }
  }
  return true;
}

export function validate(chains, location = 'body') {
  return [
    (request, _response, next) => {
      if (location === 'body' && (!request.body || Object.getPrototypeOf(request.body) !== Object.prototype)) {
        return next(new ApiError(400, 'Send a JSON object.'));
      }
      if (!safeInputKeys(request[location])) {
        return next(new ApiError(400, 'Input contains unsupported field names or nesting.'));
      }
      return next();
    },
    checkExact(chains, { locations: [location] }),
    (request, _response, next) => {
      const errors = validationResult(request).array({ onlyFirstError: true });
      if (errors.length) {
        const fields = errors.map((error) => error.type === 'field' ? error.path : 'unknown fields');
        return next(new ApiError(400, `Invalid input: ${[...new Set(fields)].join(', ')}.`));
      }
      request.input = { ...request.input, ...matchedData(request, { locations: [location] }) };
      return next();
    },
  ];
}

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const idParam = validate([param('id').isMongoId()], 'params');
export const slugParam = validate([param('slug').isLength({ max: 120 }).matches(slugPattern)], 'params');

export function text(field, { min = 1, max = 120, required = false } = {}) {
  const chain = body(field);
  if (!required) chain.optional();
  return chain.isString().bail().trim().isLength({ min, max });
}

export function boolean(field) {
  return body(field).optional().custom((value) => typeof value === 'boolean');
}

export function amount(field, { required = false, nullable = false, max = 10000000 } = {}) {
  const chain = body(field);
  if (!required) chain.optional();
  return chain.custom((value) => (nullable && value === null) ||
    (typeof value === 'number' && value >= 0 && value <= max && /^\d+(?:\.\d{1,2})?$/.test(String(value))));
}

export function strings(field, maxItems, maxLength) {
  return body(field).optional().custom((values) => Array.isArray(values) && values.length <= maxItems &&
    values.every((value) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength))
    .bail().customSanitizer((values) => values.map((value) => value.trim()));
}

export function objectWithKeys(value, keys) {
  return value && Object.getPrototypeOf(value) === Object.prototype &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

export function isImage(value) {
  if (!objectWithKeys(value, ['url', 'publicId']) || typeof value.url !== 'string' ||
      value.url.length > 2048 || typeof value.publicId !== 'string' ||
      !value.publicId.trim() || value.publicId.length > 255) return false;

  try {
    const url = new URL(value.url);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function queryValue(field) {
  return query(field).optional().isString().bail();
}
