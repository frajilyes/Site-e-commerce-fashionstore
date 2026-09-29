const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter = null;

const isConfigured = () => env.mail.isConfigured;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.port === 465,
      requireTLS: env.mail.port !== 465,
      tls: { minVersion: "TLSv1.2" },
      auth: {
        user: env.mail.user,
        pass: env.mail.pass,
      },
    });
  }
  return transporter;
};

const verifyMailer = async () => {
  if (!isConfigured()) return false;
  await getTransporter().verify();
  return true;
};

const sendMail = async ({ to, subject, html, text }) => {
  if (!isConfigured()) {
    console.log(
      `[mailer] SMTP non configure — email non envoye a ${to}` +
        (env.isProduction ? "" : `\n[mailer] ${subject}\n${text}`),
    );
    return false;
  }

  await getTransporter().sendMail({
    from: env.mail.from,
    to: to,
    subject: subject,
    text: text,
    html: html,
  });

  return true;
};

module.exports = { sendMail, verifyMailer, isMailerConfigured: isConfigured };
