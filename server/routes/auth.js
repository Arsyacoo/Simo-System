import { createHmac, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { isValidDemoCode } from '../../src/data/demoAuth.js';
import { get } from '../db/database.js';
import { asyncHandler, HttpError, sendData } from '../utils/http.js';
import { serializeUser } from '../utils/serializers.js';

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
const DEMO_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || 'simo-mugi-jaya-demo-token-secret';

const USER_SELECT = `
  SELECT u.*, r.name AS role_name
  FROM users u
  JOIN roles r ON r.id = u.role_id
`;

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(payload) {
  return createHmac('sha256', DEMO_TOKEN_SECRET).update(payload).digest('base64url');
}

function createToken(userId) {
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  const payload = base64UrlEncode(JSON.stringify({ sub: userId, exp: expiresAt }));
  const signature = signPayload(payload);

  return {
    token: `${payload}.${signature}`,
    expiresAt,
  };
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyToken(token) {
  const [payload, signature] = String(token || '').split('.');

  if (!payload || !signature || !safeEqual(signature, signPayload(payload))) {
    throw new HttpError(401, 'INVALID_TOKEN', 'Session token is invalid.');
  }

  let parsedPayload;

  try {
    parsedPayload = JSON.parse(base64UrlDecode(payload));
  } catch {
    throw new HttpError(401, 'INVALID_TOKEN', 'Session token is invalid.');
  }

  if (!parsedPayload.sub || !parsedPayload.exp || Date.parse(parsedPayload.exp) <= Date.now()) {
    throw new HttpError(401, 'TOKEN_EXPIRED', 'Session token has expired.');
  }

  return parsedPayload;
}

function readBearerToken(req) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'MISSING_TOKEN', 'Bearer token is required.');
  }

  return token;
}

async function findActiveUserByEmail(db, email) {
  return get(
    db,
    `${USER_SELECT} WHERE LOWER(u.email) = LOWER(?) AND u.is_active = 1`,
    [email],
  );
}

async function findActiveUserById(db, userId) {
  return get(
    db,
    `${USER_SELECT} WHERE u.id = ? AND u.is_active = 1`,
    [userId],
  );
}

export function createAuthRouter(db) {
  const router = Router();

  router.post('/login', asyncHandler(async (req, res) => {
    const email = String(req.body?.email || '').trim();
    const credential = req.body?.demoCode ?? req.body?.password;

    if (!email || !String(credential || '').trim()) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Email and demo code are required.');
    }

    const user = await findActiveUserByEmail(db, email);

    if (!user || !isValidDemoCode(user.id, credential)) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or demo code is invalid.');
    }

    const token = createToken(user.id);

    sendData(res, {
      user: serializeUser(user),
      ...token,
      authMode: 'backend-demo',
    });
  }));

  router.get('/me', asyncHandler(async (req, res) => {
    const payload = verifyToken(readBearerToken(req));
    const user = await findActiveUserById(db, payload.sub);

    if (!user) {
      throw new HttpError(401, 'INVALID_TOKEN', 'Session user is no longer active.');
    }

    sendData(res, {
      user: serializeUser(user),
      expiresAt: payload.exp,
      authMode: 'backend-demo',
    });
  }));

  return router;
}
