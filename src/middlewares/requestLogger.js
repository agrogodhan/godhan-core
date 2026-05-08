import coreLogger from '../utils/logger.js';
import metrics from '../utils/metrics.js';

/**
 * Factory that returns an Express request-logging middleware.
 * Pass your service logger so request logs carry the correct service name.
 *
 * Usage (in service server.js):
 *   const appLogger = core.utils.createAppLogger({ service: 'user-service', ... });
 *   app.use(core.middleware.createRequestLogger(appLogger));
 *
 * Falls back to the internal godhan-core logger when called with no argument.
 */
export default function createRequestLogger(logger = coreLogger) {
  return function requestLogger(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - start;

      logger.info('[req]', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs,
        traceId: req.traceId ?? req.headers['x-trace-id'],
        ip: req.ip || req.socket?.remoteAddress,
      });

      try {
        metrics.observeRequest(req, res, durationMs / 1000);
      } catch (err) {
        logger.warn('[core.requestLogger] metrics.observeRequest failed', { message: err.message });
      }
    });

    next();
  };
}
