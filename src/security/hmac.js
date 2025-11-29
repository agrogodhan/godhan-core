import crypto from 'crypto';
function verifySignature(payload, signature, secret) {
  const hash = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  return hash === signature;
}
const hmac = { verifySignature };
export default hmac;