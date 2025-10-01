async function sendEmail(email, otp) {
  const transporter = nodemailer.createTransport({
    service: "gmail", // or any other email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    return false;
  }
}

module.exports = { sendEmail };