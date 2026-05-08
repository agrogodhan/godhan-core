import coreLogger from './logger.js';

/**
 * SMS utilities — no Twilio credentials stored here.
 * Caller must create and pass twilioClient and from number.
 *
 * Usage:
 *   await core.utils.sms.sendOtp({ twilioClient, from: process.env.TWILIO_FROM, to, code, ttlMinutes, logger: appLogger });
 */

async function sendSms({ twilioClient, from, to, body, logger = coreLogger }) {
  if (!twilioClient) {
    logger.warn('[core.sms] no client — mock sendSms', { to });
    return { ok: true, mock: true };
  }
  return twilioClient.messages.create({ from, to, body });
}

async function sendOtp({ twilioClient, from, to, code, ttlMinutes = 10, logger = coreLogger }) {
  const body = `Your Godhan OTP is ${code}. It expires in ${ttlMinutes} minutes.`;
  return sendSms({ twilioClient, from, to, body, logger });
}

const sms = { sendSms, sendOtp };
export default sms;
