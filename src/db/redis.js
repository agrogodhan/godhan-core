import Redis from 'ioredis';
import logger from '../utils/logger.js';

function connectRedis({ url, enabled=false}) {
  if (!enabled) {
    logger.warn("[core.redis] Redis is disabled by config");
    return {
      // return a fake Redis API so code does not break accidentally
      on: () => {},
      get: async () => null,
      set: async () => {},
      quit: async () => {}
    };
  }
  const r = new Redis(url || process.env.REDIS_URL || 'redis://localhost:6379');
  r.on('connect', () => logger.info('[redis] connected'));
  r.on('error', (e) => logger.error('[redis] error', e.message));
  return r;
}

export default connectRedis;