import { isDatabaseConnected } from '../config/db.js';
import { ApiError } from '../utils/http.js';

export function requireDatabase(_request, _response, next) {
  if (!isDatabaseConnected()) return next(new ApiError(503, 'Database is unavailable.'));
  return next();
}
