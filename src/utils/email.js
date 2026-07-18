/**
 * Email utilities — no SMTP config stored here.
 * Caller must create and pass a nodemailer transporter.
 *
 * Example:
 *   import nodemailer from 'nodemailer';
 *   const transporter = nodemailer.createTransport({ host, port, auth: { user, pass } });
 *   await core.utils.email.sendEmail({ transporter, from, to, subject, html, logger: appLogger });
 *   await core.utils.email.sendTemplateEmail({ transporter, from, to, subject, templateName, context, logger: appLogger });
 */

import getTemplate from './template.service.js';
import coreLogger from './logger.js';

async function sendEmail({ transporter, from, to, subject, html, text, logger = coreLogger }) {
  if (!transporter) {
    logger.warn('[core.email] no transporter — mock sendEmail', { to, subject });
    return { ok: true, mock: true };
  }
  const info = await transporter.sendMail({ from, to, subject, html, text });
  logger.info('[core.email] sent', { to, subject, messageId: info.messageId });
  return info;
}

async function sendTemplateEmail({ transporter, from, to, subject, templateName, context = {}, channel = 'email', logger = coreLogger }) {
  const compiledTemplate = await getTemplate(channel, templateName, logger);
  if (!compiledTemplate) {
    throw new Error(`[core.email] template not found: ${channel}_${templateName}`);
  }
  const html = compiledTemplate(context);
  return sendEmail({ transporter, from, to, subject, html, logger });
}

const email = { sendEmail, sendTemplateEmail };
export default email;
