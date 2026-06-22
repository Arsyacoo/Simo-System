import jwt from 'jsonwebtoken';
import { HttpError } from './http.js';

const JWT_SECRET = process.env.JWT_SECRET || 'simo-mugi-jaya-secret-key';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Akses ditolak. Token autentikasi diperlukan.');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    throw new HttpError(401, 'INVALID_TOKEN', 'Token tidak valid atau kedaluwarsa.');
  }
}

