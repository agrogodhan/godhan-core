import logger from '../utils/logger.js';
import metrics from '../utils/metrics.js';

export default function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    logger.info('[req]', { method: req.method, url: req.originalUrl, status: res.statusCode, duration, traceId: req.headers['x-trace-id'] });
    try { metrics.observeRequest(req, res, duration); } catch (e) { /* ignore */ }
  });
  next();
};