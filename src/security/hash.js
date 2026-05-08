import bcrypt from 'bcryptjs';

/**
 * Password hashing utilities.
 * Salt rounds are caller-controlled — pass from env, not hardcoded.
 *
 * Usage:
 *   const hashed = await core.security.hashUtils.hash(plain, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
 *   const ok = await core.security.hashUtils.compare(plain, hashed);
 */

async function hash(plain, saltRounds = 10) {
  if (!plain) throw new Error('[core.hash] plain text is required');
  return bcrypt.hash(plain, saltRounds);
}

async function compare(plain, hashed) {
  if (!plain || !hashed) return false;
  return bcrypt.compare(plain, hashed);
}

const hashUtils = { hash, compare };

export default hashUtils;
