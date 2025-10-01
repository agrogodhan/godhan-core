const twilio = require("twilio");

async function sendSMS(mobile, otp) {
  // Example SMS implementation using Twilio
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  const recipientPhone = identifier; // Assuming identifier is a phone number

  if (accountSid && authToken && twilioPhone) {
    try {
      await twilio.messages.create({
        body: `Your OTP code is: ${otp}`,
        from: twilioPhone,
        to: recipientPhone,
      });
    } catch (err) {
      console.error("Failed to send SMS:", err);
      return false;
    }
  } else {
    console.warn("Twilio credentials not set. SMS not sent.");
  }
}

module.exports = { sendSMS };