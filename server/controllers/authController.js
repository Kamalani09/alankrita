import bcrypt from 'bcrypt';
import { hasJwtSecret, issueAdminToken } from '../middleware/auth.js';
import { Admin, adminId } from '../models/Admin.js';
import { ApiError, sendSuccess } from '../utils/http.js';

// A dummy hash keeps a bcrypt check on the invalid-email path too.
const dummyHash = await bcrypt.hash('unused-alankrita-login-value', 12);

export function login(secret) {
  return async (request, response) => {
    if (!hasJwtSecret(secret)) throw new ApiError(503, 'Admin authentication is unavailable.');

    const { email, password } = request.input;
    const admin = await Admin.findOne({ _id: adminId, email }).select('+passwordHash +tokenVersion');
    const matches = await bcrypt.compare(password, admin?.passwordHash ?? dummyHash);

    if (!admin || !matches) throw new ApiError(401, 'Invalid email or password.');

    response.set('Cache-Control', 'no-store');
    return sendSuccess(response, {
      token: issueAdminToken(admin, secret),
      tokenType: 'Bearer',
      expiresIn: 3600,
      admin: { email: admin.email },
    }, 'Login successful.');
  };
}
