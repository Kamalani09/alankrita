import jwt from 'jsonwebtoken';
import { Admin, adminId } from '../models/Admin.js';
import { ApiError } from '../utils/http.js';

const tokenOptions = {
  algorithm: 'HS256',
  issuer: 'alankrita-api',
  audience: 'alankrita-admin',
};

export function hasJwtSecret(secret) {
  return typeof secret === 'string' && Buffer.byteLength(secret.trim()) >= 32;
}

export function issueAdminToken(admin, secret) {
  return jwt.sign({ version: admin.tokenVersion }, secret, {
    ...tokenOptions,
    subject: admin.id,
    expiresIn: '1h',
  });
}

export function requireAdmin(secret) {
  return async (request, _response, next) => {
    const token = request.get('Authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
    if (!token) throw new ApiError(401, 'Admin authentication is required.');
    if (!hasJwtSecret(secret)) throw new ApiError(503, 'Admin authentication is unavailable.');

    let claims;
    try {
      claims = jwt.verify(token, secret, {
        algorithms: [tokenOptions.algorithm],
        issuer: tokenOptions.issuer,
        audience: tokenOptions.audience,
      });
    } catch {
      throw new ApiError(401, 'Invalid or expired admin token.');
    }

    const admin = claims.sub === adminId && await Admin.findById(adminId).select('+tokenVersion');
    if (!admin || claims.version !== admin.tokenVersion) {
      throw new ApiError(401, 'Invalid or expired admin token.');
    }
    next();
  };
}
