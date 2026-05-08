import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import coreLogger from '../utils/logger.js';

/**
 * Create an Axios HTTP client for inter-service communication.
 * No credentials stored — token is resolved per-request via getter.
 *
 * Usage:
 *   const appLogger = core.utils.createAppLogger({ service: 'user-service', ... });
 *
 *   // static token
 *   const client = core.http.apiClient('http://auth-service', () => process.env.SERVICE_TOKEN, { logger: appLogger });
 *
 *   // forward caller's token (created inside request handler)
 *   const client = core.http.apiClient('http://cattle-service', () => req.headers.authorization?.slice(7), { logger: appLogger });
 *
 *   // no auth
 *   const client = core.http.apiClient('http://public-service');
 *
 * @param {string}          baseURL           Target service base URL (required)
 * @param {Function|null}   getToken          Function that returns the current Bearer token (optional)
 * @param {Object}          opts
 * @param {number}          opts.timeout      Request timeout in ms (default 10000)
 * @param {object}          opts.logger       Winston logger — pass your service logger so
 *                                            failed requests appear under the correct service name
 */
function createApiClient(baseURL, getToken = null, { timeout = 10000, logger = coreLogger } = {}) {
  if (!baseURL) throw new Error('[core.apiClient] baseURL is required');
  if (getToken !== null && typeof getToken !== 'function') {
    throw new Error('[core.apiClient] getToken must be a function, e.g. () => token');
  }

  const client = axios.create({ baseURL, timeout });

  client.interceptors.request.use((config) => {
    config.headers['x-trace-id'] ??= uuidv4();
    const token = getToken?.();
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      const method = err.config?.method?.toUpperCase();
      const url = err.config?.url;
      const status = err.response?.status;
      logger.error('[core.apiClient] request failed', {
        method,
        url: `${baseURL}${url}`,
        status,
        message: err.message,
      });
      return Promise.reject(err);
    }
  );

  return client;
}

export default createApiClient;
