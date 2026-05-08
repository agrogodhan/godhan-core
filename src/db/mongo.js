import mongoose from 'mongoose';
import coreLogger from '../utils/logger.js';

const DEFAULT_RETRY_MS = 2000;
const DEFAULT_MAX_RETRIES = 10;

let handlersAttached = false;

/**
 * Connect to MongoDB with automatic retry.
 * No credentials stored — caller must pass uri.
 *
 * Usage (in service server.js):
 *   const appLogger = core.utils.createAppLogger({ service: 'user-service', ... });
 *   await core.db.connectMongo({ uri: process.env.MONGO_URI, logger: appLogger });
 *
 * @param {Object} opts
 *   uri        {string}  MongoDB connection string (required)
 *   options    {object}  Extra mongoose.connect options (optional)
 *   retryMs    {number}  Milliseconds between retries (default 2000)
 *   maxRetries {number}  Max attempts before throwing (default 10)
 *   logger     {object}  Winston logger instance — pass your service logger so
 *                        connection events appear under the correct service name
 *
 * @returns {mongoose.Connection}
 */
async function connectMongo({
  uri,
  options = {},
  retryMs = DEFAULT_RETRY_MS,
  maxRetries = DEFAULT_MAX_RETRIES,
  logger = coreLogger,
} = {}) {
  if (!uri) throw new Error('[core.db] connectMongo: uri is required');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`[core.db] connecting to MongoDB (attempt ${attempt}/${maxRetries})`);
      await mongoose.connect(uri, options);
      logger.info('[core.db] MongoDB connected');
      attachHandlers(logger);
      return mongoose.connection;
    } catch (err) {
      logger.error(`[core.db] attempt ${attempt} failed: ${err.message}`);
      if (attempt === maxRetries) throw err;
      logger.info(`[core.db] retrying in ${retryMs}ms...`);
      await new Promise((r) => setTimeout(r, retryMs));
    }
  }
}

function attachHandlers(logger) {
  if (handlersAttached) return;
  handlersAttached = true;
  mongoose.connection.on('disconnected', () => logger.warn('[core.db] disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('[core.db] reconnected'));
  mongoose.connection.on('error', (err) => logger.error('[core.db] error', { message: err.message }));
}

export default connectMongo;
