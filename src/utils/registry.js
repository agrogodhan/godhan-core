import axios from 'axios';
import logger from '../utils/logger.js';

async function registerService({ name, version, port, healthUrl }) {
  const url = process.env.CORE_REGISTRY_URL;
  if (!url) { logger.warn('registry: CORE_REGISTRY_URL not set'); return; }
  try { await axios.post(`${url}/register`, { name, version, port, healthUrl }); logger.info('registry: registered'); } catch (err) { logger.warn('registry: failed', err.message); }
}

const registry = {
  registerService,
};

export default registry;