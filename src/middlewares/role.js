import response from '../http/response.js';

/**
 * Role-based access control middleware factory.
 * Requires createAuth to run first (populates req.user).
 *
 * Usage:
 *   router.delete('/users/:id', requireAuth, role('admin'), handler);
 *   router.post('/publish',     requireAuth, role(['admin', 'hub']), handler);
 */
export default function role(requiredRole) {
  const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      res.set('WWW-Authenticate', 'Bearer');
      return response.error(res, null, 'Unauthorized', 401);
    }
    if (!allowed.includes(req.user.role)) {
      return response.error(res, null, `Forbidden: requires role ${allowed.join(' or ')}`, 403);
    }
    next();
  };
}
