import axios from 'axios';
import coreLogger from './logger.js';

/**
 * Service registry client — no URL stored here.
 * Caller passes the registry URL and service logger from their environment.
 *
 * Usage:
 *   await core.utils.registry.registerService({
 *     registryUrl: process.env.CORE_REGISTRY_URL,
 *     name: 'user-service',
 *     version: '1.0.0',
 *     port: 3001,
 *     healthUrl: 'http://user-service:3001/health',
 *     logger: appLogger,
 *   });
 */

async function registerService({ registryUrl, name, version, port, healthUrl, logger = coreLogger }) {
  if (!registryUrl) {
    logger.warn('[core.registry] registryUrl not provided — skipping registration');
    return;
  }

  try {
    await axios.post(`${registryUrl}/register`, { name, version, port, healthUrl });
    logger.info('[core.registry] registered', { name, version });
  } catch (err) {
    logger.warn('[core.registry] registration failed', { name, message: err.message });
  }
}

const registry = { registerService };
export default registry;
