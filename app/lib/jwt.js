import crypto from 'crypto';

// Minimal JWT helper without external deps. Uses HMAC SHA256.
// In production prefer a battle-tested library (jsonwebtoken) and rotate secrets safely.

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function encode(obj) {
  return base64url(JSON.stringify(obj));
}

function sign(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function signToken(payload, opts = {}) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const expiresIn = opts.expiresIn ?? 60 * 60 * 24 * 7; // default 7 days in seconds
  const exp = iat + expiresIn;
  const body = { ...payload, iat, exp };

  const headerB = encode(header);
  const bodyB = encode(body);
  const signature = sign(`${headerB}.${bodyB}`, secret);
  return `${headerB}.${bodyB}.${signature}`;
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  if (!token || typeof token !== 'string') throw new Error('No token');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  const [headerB, bodyB, signature] = parts;
  const expected = sign(`${headerB}.${bodyB}`, secret);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error('Invalid signature');
  }
  const payload = JSON.parse(Buffer.from(bodyB, 'base64').toString('utf8'));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) throw new Error('Token expired');
  return payload;
}
