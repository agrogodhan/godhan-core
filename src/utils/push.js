import coreLogger from './logger.js';

/**
 * FCM push utilities — no Firebase credentials stored here.
 * Caller creates and passes an admin.messaging() instance (or leaves it undefined if
 * Firebase Admin isn't configured yet — every call below falls back to a logged mock instead
 * of throwing, same convention as core.utils.sms/s3Utils).
 *
 * Usage:
 *   import admin from 'firebase-admin';
 *   const messaging = admin.apps.length ? admin.messaging() : undefined;
 *
 *   await core.utils.push.sendPush({ messaging, tokens, title, body, data, logger: appLogger });
 */

// FCM's `data` payload only accepts string values — coerced here so callers can pass whatever
// they naturally have (numbers, booleans) without remembering that constraint themselves.
function stringifyData(data) {
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));
}

async function sendPush({ messaging, tokens, title, body, data = {}, logger = coreLogger }) {
  const tokenList = (Array.isArray(tokens) ? tokens : [tokens]).filter(Boolean);
  if (tokenList.length === 0) return { ok: true, sent: 0, failed: 0, mock: false };

  if (!messaging) {
    logger.warn('[core.push] no client — mock sendPush', { title, tokens: tokenList.length });
    return { ok: true, sent: 0, failed: tokenList.length, mock: true };
  }

  const message = {
    notification: { title, body },
    data: stringifyData(data),
    tokens: tokenList,
  };

  const res = await messaging.sendEachForMulticast(message);
  // Per-token results (res.responses[i].success/error) — a stale/uninstalled-app token shows up
  // here as a failure; pruning those from DeviceToken is the caller's job, not this utility's.
  return { ok: true, sent: res.successCount, failed: res.failureCount, mock: false, responses: res.responses };
}

const push = { sendPush };
export default push;
