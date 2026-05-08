import coreLogger from '../utils/logger.js';
import response from './response.js';

/**
 * Factory that returns an Express error-handling middleware (4-arg).
 * Pass your service logger so error logs carry the correct service name.
 *
 * Usage (in service server.js — must be registered LAST):
 *   const appLogger = core.utils.createAppLogger({ service: 'user-service', ... });
 *   app.use(core.http.createErrorHandler(appLogger));
 *
 * Falls back to the internal godhan-core logger when called with no argument.
 */
export default function createErrorHandler(logger = coreLogger) {
  return function errorHandler(err, req, res, next) {
    logger.error('[errorHandler]', { message: err.message, stack: err.stack });
    if (res.headersSent) return next(err);
    return response.error(res, err.details || null, err.message || 'Internal Server Error', err.status || 500);
  };
}
