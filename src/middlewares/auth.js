/**
 * Auth middleware factory — no secret stored in core.
 * Caller provides the JWT secret when creating the middleware.
 *
 * Usage:
 *   import core from '@godhan/core';
 *   const requireAuth = core.middleware.createAuth(process.env.JWT_SECRET);
 *   router.post('/protected', requireAuth, handler);
 *
 * On success: sets req.user = decoded JWT payload and calls next().
 * On failure: returns 401 JSON using core response format.
 */

import jwtUtils from '../security/jwt.js';
import response from '../http/response.js';

function createAuth(secret) {
  if (!secret) throw new Error('[core.auth] JWT secret is required to create auth middleware');

  return function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return response.error(res, null, 'Unauthorized: missing token', 401);
    }
    const token = header.slice(7);
    try {
      req.user = jwtUtils.verify(token, { secret });
      next();
    } catch {
      return response.error(res, null, 'Unauthorized: invalid or expired token', 401);
    }
  };
}

export default createAuth;
