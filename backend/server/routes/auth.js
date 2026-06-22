import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { get } from '../db/database.js';
import { asyncHandler, HttpError, sendData } from '../utils/http.js';
import { serializeUser } from '../utils/serializers.js';

const JWT_SECRET = process.env.JWT_SECRET || 'simo-mugi-jaya-secret-key';

export function createAuthRouter(db) {
  const router = Router();

  router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Email dan password harus diisi.');
    }

    // Demo password check - allow "password" for any active seed user
    if (password !== 'password') {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email atau password salah.');
    }

    const user = await get(
      db,
      `SELECT u.*, r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = ? AND u.is_active = 1`,
      [String(email).trim().toLowerCase()]
    );

    if (!user) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email atau password salah.');
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.role_id,
        roleName: user.role_name,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    sendData(res, {
      token,
      user: serializeUser(user),
    });
  }));

  return router;
}
