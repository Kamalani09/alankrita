import multer from 'multer';
import { ApiError } from '../utils/http.js';

export function errorHandler(error, _request, response, next) {
  if (response.headersSent) return next(error);

  if (error instanceof ApiError) return fail(response, error.status, error.message);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return fail(response, 413, 'Image must be 5 MiB or smaller.');
    return fail(response, 400, 'Send exactly one file in the image field.');
  }
  if (error.code === 11000) return fail(response, 409, 'A record already uses that unique value.');
  if (error.name === 'VersionError') return fail(response, 409, 'The record changed. Reload it and try again.');
  if (['ValidationError', 'CastError'].includes(error.name)) return fail(response, 400, 'Invalid document fields.');
  if (error.type === 'entity.parse.failed') return fail(response, 400, 'Malformed JSON.');
  if (error.type === 'entity.too.large') return fail(response, 413, 'Request body is too large.');
  if (['encoding.unsupported', 'charset.unsupported'].includes(error.type)) {
    return fail(response, 415, 'Unsupported request encoding.');
  }
  if (error.name === 'URIError') return fail(response, 400, 'Malformed URL.');

  console.error('Unhandled API error:', error.name);
  return fail(response, 500, 'Internal server error.');
}

function fail(response, status, message) {
  return response.status(status).json({
    success: false,
    data: null,
    message,
  });
}
