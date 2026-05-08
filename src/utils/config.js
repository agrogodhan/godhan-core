import mongoose from 'mongoose';
import coreLogger from './logger.js';

/**
 * MongoDB-backed dynamic key-value config store.
 * Lazily registers the Config model on first use — no explicit init required.
 * Useful for runtime settings (feature flags, percentages) that change without redeploy.
 *
 * Usage:
 *   const rate = await core.utils.config.getConfig('CASHBACK_PERCENT', 5);
 *   await core.utils.config.setConfig('CASHBACK_PERCENT', '10', 'number', appLogger);
 */

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

async function getConfig(key, defaultValue) {
  const Config = getModel();
  const doc = await Config.findOne({ key }).lean();
  if (!doc) return defaultValue;

  switch (doc.type) {
    case 'number':  return Number(doc.value);
    case 'boolean': return doc.value === 'true';
    default:        return doc.value;
  }
}

async function setConfig(key, value, type = 'string', logger = coreLogger) {
  const Config = getModel();
  await Config.findOneAndUpdate(
    { key },
    { value: String(value), type },
    { upsert: true, new: true }
  );
  logger.info('[core.config] set', { key, type });
}

const config = { getConfig, setConfig };
export default config;
