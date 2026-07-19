/**
 * Notification orchestrator — no credentials or config stored here.
 * All dependencies (transporter, twilioClient, messaging, logger, etc.) are passed per-call.
 *
 * Usage:
 *   await core.utils.notifier.notifyEmail({ transporter, from, to, subject, templateName, context, logger: appLogger });
 *   await core.utils.notifier.notifySMS({ twilioClient, from, to, body, logger: appLogger });
 *   await core.utils.notifier.notifyOtp({ twilioClient, from, to, code, ttlMinutes, logger: appLogger });
 *   await core.utils.notifier.notifyPush({ messaging, tokens, title, body, data, logger: appLogger });
 */

import email from './email.js';
import sms from './sms.js';
import push from './push.js';
import coreLogger from './logger.js';

async function notifyEmail({ transporter, from, to, subject, templateName, context = {}, channel = 'email', logger = coreLogger }) {
  try {
    return await email.sendTemplateEmail({ transporter, from, to, subject, templateName, context, channel, logger });
  } catch (err) {
    logger.error('[core.notifier] email failed', { to, templateName, error: err.message });
    return null;
  }
}

async function notifySMS({ twilioClient, from, to, body, logger = coreLogger }) {
  try {
    return await sms.sendSms({ twilioClient, from, to, body, logger });
  } catch (err) {
    logger.error('[core.notifier] sms failed', { to, error: err.message });
    return null;
  }
}

async function notifyOtp({ twilioClient, from, to, code, ttlMinutes = 10, logger = coreLogger }) {
  try {
    return await sms.sendOtp({ twilioClient, from, to, code, ttlMinutes, logger });
  } catch (err) {
    logger.error('[core.notifier] otp failed', { to, error: err.message });
    return null;
  }
}

async function notifyPush({ messaging, tokens, title, body, data = {}, logger = coreLogger }) {
  try {
    return await push.sendPush({ messaging, tokens, title, body, data, logger });
  } catch (err) {
    logger.error('[core.notifier] push failed', { title, error: err.message });
    return null;
  }
}

const notifier = { notifyEmail, notifySMS, notifyOtp, notifyPush };
export default notifier;
