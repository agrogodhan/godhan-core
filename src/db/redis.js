import Redis from 'ioredis';
import coreLogger from '../utils/logger.js';

const CONNECT_TIMEOUT_MS = 10000;

/**
 * Connect to Redis and wait until the client is ready.
 * No credentials stored — caller must pass url when enabled.
 *
 * Usage (in service server.js):
 *   const appLogger = core.utils.createAppLogger({ service: 'user-service', ... });
 *   const redis = await core.db.connectRedis({ url: process.env.REDIS_URL, enabled: true, logger: appLogger });
 *
 * When disabled, returns a no-op mock so service code runs without Redis.
 *
 * @param {Object} opts
 *   url      {string}  Redis connection URL (required when enabled)
 *   enabled  {boolean} Enable real Redis (default false)
 *   options  {object}  Extra ioredis options (optional)
 *   logger   {object}  Winston logger instance — pass your service logger so
 *                      connection events appear under the correct service name
 *
 * @returns {Redis|MockRedis}
 */
async function connectRedis({ url, enabled = false, options = {}, logger = coreLogger } = {}) {
  if (!enabled) {
    logger.warn('[core.redis] disabled — returning null mock');
    return createMock();
  }

  if (!url) throw new Error('[core.redis] connectRedis: url is required when enabled');

  const client = new Redis(url, { lazyConnect: false, ...options });

  attachHandlers(client, logger);
  await waitForReady(client, logger);

  return client;
}

async function waitForReady(client, logger) {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.disconnect();
      reject(new Error(`[core.redis] connection timed out after ${CONNECT_TIMEOUT_MS}ms`));
    }, CONNECT_TIMEOUT_MS);

    client.once('ready', () => {
      clearTimeout(timer);
      logger.info('[core.redis] connected and ready');
      resolve();
    });
  });
}

function attachHandlers(client, logger) {
  client.on('error', (err) => logger.error('[core.redis] error', { message: err.message }));
  client.on('close', () => logger.warn('[core.redis] connection closed'));
  client.on('reconnecting', () => logger.info('[core.redis] reconnecting...'));
  client.on('end', () => logger.warn('[core.redis] no more retries — connection ended'));
}

function createMock() {
  const noop = async () => null;
  return {
    // strings
    get: noop, set: noop, del: noop,
    exists: noop, expire: noop, ttl: noop,
    incr: noop, decr: noop, incrby: noop,
    // hashes
    hget: noop, hset: noop, hdel: noop, hgetall: noop, hmset: noop, hmget: noop,
    // lists
    lpush: noop, rpush: noop, lpop: noop, rpop: noop, lrange: noop, llen: noop,
    // sets
    sadd: noop, srem: noop, smembers: noop, sismember: noop,
    // sorted sets
    zadd: noop, zrem: noop, zrange: noop, zrank: noop,
    // utility
    keys: async () => [],
    flushdb: noop,
    quit: noop,
    disconnect: noop,
    on: () => {},
    status: 'mock',
  };
}

export default connectRedis;
