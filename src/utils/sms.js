/**
 * SMS utilities (no Twilio init here).
 * Caller must pass twilioClient and from number.
 *
 * Example call:
 *  await core.sms.sendOtp({ twilioClient, from: process.env.TWILIO_FROM, to: mobile, code, ttlMinutes });
 */

async function sendSms({ twilioClient, from, to, body }) {
  if (!twilioClient) {
    // mock/send-to-logs behavior if no client provided
    console.log('[core.sms] mock sendSms', { to, body });
    return { ok: true, mock: true };
  }
  return twilioClient.messages.create({ from, to, body });
}

async function sendOtp({ twilioClient, from, to, code, ttlMinutes = 10 }) {
  const body = `Your Godhan OTP is ${code}. It expires in ${ttlMinutes} minutes.`;
  return sendSms({ twilioClient, from, to, body });
}

const sms = { sendSms, sendOtp };
export default sms;
