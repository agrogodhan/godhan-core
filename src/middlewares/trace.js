import { v4 as uuidv4 } from 'uuid';

/**
 * Distributed trace ID middleware.
 * Propagates X-Trace-Id from upstream or generates a new one.
 * Sets req.traceId for downstream use (e.g. requestLogger, apiClient).
 */
export default function trace(req, res, next) {
  const traceId = req.headers['x-trace-id'] || uuidv4();
  req.traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);
  next();
}
