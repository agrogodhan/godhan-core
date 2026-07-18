import mongoose from 'mongoose';
import coreLogger from './logger.js';

/**
 * MongoDB-backed dynamic key-value config store.
 * Lazily registers the Config model on first use — no explicit init required.
 * Useful for runtime settings (feature flags, percentages) that change without redeploy.
 *
 * getConfig is read-heavy by design (called on hot paths like wallet recharge), so reads are
 * cached in-process for CACHE_TTL_MS. Cache is per-process (one per service instance) — a
 * setConfig from a different service instance is picked up within CACHE_TTL_MS, not instantly.
 * That staleness window is intentional: these are slow-changing values (rates, feature flags),
 * not values requiring cross-instance read-your-writes consistency.
 *
 * Usage:
 *   const rate = await core.utils.config.getConfig('CASHBACK_PERCENT', 5);
 *   await core.utils.config.setConfig('CASHBACK_PERCENT', '10', 'number', appLogger);
 */

const CACHE_TTL_MS = 30_000;
const cache = new Map(); // key -> { value, expiresAt }

const ConfigSchema = new mongoose.Schema(
  {
    key:   { type: String, required: true, unique: true },
    value: { type: String, required: true },
    type:  { type: String, enum: ['string', 'number', 'boolean'], default: 'string' },
  },
  { timestamps: true }
);

function getModel() {
  return mongoose.models.Config || mongoose.model('Config', ConfigSchema);
}

function coerce(value, type) {
  switch (type) {
    case 'number':  return Number(value);
    case 'boolean': return value === 'true';
    default:        return value;
  }
}

async function getConfig(key, defaultValue) {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const Config = getModel();
  const doc = await Config.findOne({ key }).lean();
  const value = doc ? coerce(doc.value, doc.type) : defaultValue;

  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

async function setConfig(key, value, type = 'string', logger = coreLogger) {
  const Config = getModel();
  await Config.findOneAndUpdate(
    { key },
    { value: String(value), type },
    { upsert: true, new: true }
  );
  cache.set(key, { value: coerce(String(value), type), expiresAt: Date.now() + CACHE_TTL_MS });
  logger.info('[core.config] set', { key, type });
}

const config = { getConfig, setConfig };
export default config;
