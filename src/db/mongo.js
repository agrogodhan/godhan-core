import mongoose from 'mongoose';
import logger from '../utils/logger.js';   // ✅ logger auto-injected here

const DEFAULT_RETRY_MS = 2000;
const DEFAULT_MAX_RETRIES = 10;

/**
 * connectMongo - reusable MongoDB connector using shared logger
 * @param {Object} opts
 *  - uri: MongoDB connection string (required)
 *  - options: mongoose options (optional)
 *  - retryMs: milliseconds between retries
 *  - maxRetries: number of retry attempts
 */
async function connectMongo({
  uri,
  options = {},
  retryMs = DEFAULT_RETRY_MS,
  maxRetries = DEFAULT_MAX_RETRIES
}) {
  if (!uri) throw new Error('connectMongo requires uri');

  let attempts = 0;

  const baseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    ...options,
  };

  async function attemptConnect() {
    attempts += 1;

    try {
      logger.info(`[core.db] connecting to mongo (attempt ${attempts})`);

      await mongoose.connect(uri, baseOptions);

      logger.info('[core.db] mongoose connected');

      attachHandlers();

      return mongoose;
    } catch (err) {
      logger.error(`[core.db] connection attempt ${attempts} failed: ${err.message}`);

      if (attempts >= maxRetries) {
        logger.error('[core.db] max retries reached, throwing');
        throw err;
      }

      logger.info(`[core.db] retrying in ${retryMs}ms...`);
      await new Promise((r) => setTimeout(r, retryMs));

      return attemptConnect();
    }
  }

  return attemptConnect();
}

function attachHandlers() {
  mongoose.connection.on('connected', () => logger.info('[core.db] connected'));
  mongoose.connection.on('error', (err) => logger.error('[core.db] error', err));
  mongoose.connection.on('disconnected', () => logger.warn('[core.db] disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('[core.db] reconnected'));
  mongoose.connection.on('reconnectFailed', () => logger.error('[core.db] reconnectFailed'));
}

export default connectMongo;
