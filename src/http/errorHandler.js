import logger from '../utils/logger.js';
import response from './response.js';

function errorHandler(err, req, res, next) {
  logger.error('[errorHandler]', err.stack || err.message || err);
  if (res.headersSent) return next(err);
  return response.error(res, err.message || 'Internal Server Error', err.status || 500, err.details || null);
}

export default errorHandler;