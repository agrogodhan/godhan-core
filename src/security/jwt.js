import jwt from 'jsonwebtoken';

/**
 * JWT utilities — secret is never stored here.
 * Caller passes secret (and any jwt options) on every call.
 *
 * Usage:
 *   const token = core.security.jwt.sign(payload, { secret: process.env.JWT_SECRET, expiresIn: '15m' });
 *   const decoded = core.security.jwt.verify(token, { secret: process.env.JWT_SECRET });
 *   const raw = core.security.jwt.decode(token); // no verification — use only for non-sensitive reads
 */

function sign(payload, { secret, ...opts } = {}) {
  if (!secret) throw new Error('[core.jwt] secret is required');
  return jwt.sign(payload, secret, opts);
}

function verify(token, { secret } = {}) {
  if (!secret) throw new Error('[core.jwt] secret is required');
  return jwt.verify(token, secret);
}

function decode(token) {
  return jwt.decode(token);
}

const jwtUtils = { sign, verify, decode };

export default jwtUtils;
