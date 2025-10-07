// emailService.js
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");

/**
 * Reusable function to send email
 * Supports plain text, HTML templates (Handlebars), and attachments
 *
 * @param {Object} config - Configuration object {host, port, secure, auth}
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.template] - Template filename (without extension)
 * @param {Object} [options.context] - Data for template rendering
 * @param {Array} [options.attachments] - Array of attachment objects
 * @returns {Promise<void>}
 */
async function sendEmail(
  { host, port, secure, auth },
  { to, subject, text, template, context, attachments }
) {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure, // true for 465, false for other ports
      auth,
    });

    // Configure Handlebars templates
    transporter.use(
      "compile",
      hbs({
        viewEngine: {
          extname: ".hbs",
          layoutsDir: path.join(__dirname, "templates"),
          defaultLayout: false,
        },
        viewPath: path.join(__dirname, "templates"),
        extName: ".hbs",
      })
    );

    // Build email options
    const mailOptions = {
      from: `"Godhan App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      template,
      context,
      attachments, // ✅ support attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = { sendEmail };
