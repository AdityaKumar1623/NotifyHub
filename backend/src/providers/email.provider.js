const nodemailer = require('nodemailer');
const { getChaosFlags } = require('../middleware/chaos');

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER || 'user@example.com';
const smtpPass = process.env.SMTP_PASS || 'app-password';
const smtpFrom = process.env.SMTP_FROM || `NotifyHub <${smtpUser}>`;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

async function sendEmail({ to, subject, html, text }) {
  const chaosFlags = await getChaosFlags();
  if (chaosFlags.CHAOS_FORCE_EMAIL_FAILURE) {
    const error = new Error('Simulated email provider unavailable (HTTP 503)');
    error.statusCode = 503;
    console.warn('Chaos fault injected: email provider returned 503');
    throw error;
  }

  const info = await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    text,
    html,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  };
}

module.exports = {
  sendEmail,
};
