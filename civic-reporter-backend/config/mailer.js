const nodemailer = require("nodemailer");

// Uses Gmail by default. Requires an "App Password" (not your normal Gmail password).
// If EMAIL_USER / EMAIL_PASS are not set, emails are skipped silently (safe for dev).
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Email skipped - no EMAIL_USER/EMAIL_PASS set] To: ${to} | ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Civic Reporter" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
};

module.exports = sendEmail;
