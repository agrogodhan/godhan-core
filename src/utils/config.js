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
 *
 * For Mongoose virtual getters, which run synchronously during document serialization and can't
 * await: call core.utils.config.primeConfig('KEY', default) once at server startup, then read it
 * synchronously in the virtual via core.utils.config.getConfigSync('KEY', default).
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

// Synchronous read of whatever's currently cached — for call sites that can't await, namely
// Mongoose virtual getters (they run during document serialization, not as part of any request's
// async flow). Falls back to defaultValue if nothing has been cached yet, which is why callers
// using this must also call primeConfig for the same key at service startup, so the real value is
// warm before the first document ever gets serialized.
function getConfigSync(key, defaultValue) {
  const cached = cache.get(key);
  return cached ? cached.value : defaultValue;
}

// Populates (and keeps refreshing) the cache for a key a getConfigSync call site depends on.
// Call once at server startup, and optionally on an interval, so a setConfig change eventually
// reaches synchronous readers too — getConfig's own cache TTL already handles the refresh cadence
// once primed, this just does the first, necessary async fetch.
async function primeConfig(key, defaultValue) {
  await getConfig(key, defaultValue);
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

const config = { getConfig, getConfigSync, primeConfig, setConfig };
export default config;
