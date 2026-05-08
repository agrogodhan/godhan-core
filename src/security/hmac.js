import crypto from 'crypto';

/**
 * HMAC-SHA256 utilities for webhook and payload signature handling.
 * Secret is never stored — caller passes it on every call.
 *
 * Usage:
 *   // signing (e.g. outbound webhook)
 *   const sig = core.security.hmac.createSignature(rawBody, process.env.WEBHOOK_SECRET);
 *
 *   // verifying (e.g. inbound webhook — pass raw string body, not re-parsed object)
 *   const ok = core.security.hmac.verifySignature(rawBody, req.headers['x-signature'], process.env.WEBHOOK_SECRET);
 */

function createSignature(payload, secret) {
  if (!secret) throw new Error('[core.hmac] secret is required');
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function verifySignature(payload, signature, secret) {
  if (!secret) throw new Error('[core.hmac] secret is required');
  if (!signature) return false;
  const expected = createSignature(payload, secret);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}

const hmac = { createSignature, verifySignature };

export default hmac;
