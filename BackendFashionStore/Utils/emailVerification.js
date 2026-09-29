const crypto = require("crypto");
const env = require("../config/env");
const { sendMail } = require("./mailer");

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const hashToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

const setEmailVerificationToken = (userDoc) => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  userDoc.emailVerificationToken = hashToken(rawToken);
  userDoc.emailVerificationExpires = new Date(Date.now() + TOKEN_TTL_MS);

  return rawToken;
};

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );

const buildVerificationUrl = (rawToken) =>
  `${env.clientUrl}/verify-email?token=${rawToken}`;

const sendVerificationEmail = async (userDoc, rawToken) => {
  const url = buildVerificationUrl(rawToken);

  const text =
    `Bonjour ${userDoc.firstName},\n\n` +
    "Confirmez votre adresse email pour activer votre compte FashionStore :\n" +
    `${url}\n\n` +
    "Ce lien expire dans 24 heures.\n" +
    "Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.";

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#111">
      <h2 style="margin:0 0 16px">Confirmez votre adresse email</h2>
      <p>Bonjour ${escapeHtml(userDoc.firstName)},</p>
      <p>Il ne reste qu'une étape pour activer votre compte FashionStore.</p>
      <p style="margin:28px 0">
        <a href="${url}"
           style="background:#111;color:#fff;padding:12px 24px;border-radius:6px;
                  text-decoration:none;display:inline-block">
          Confirmer mon email
        </a>
      </p>
      <p style="font-size:13px;color:#555">
        Ou copiez ce lien dans votre navigateur :<br>
        <a href="${url}">${url}</a>
      </p>
      <p style="font-size:13px;color:#555">Ce lien expire dans 24 heures.</p>
      <p style="font-size:13px;color:#555">
        Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.
      </p>
    </div>`;

  const sent = await sendMail({
    to: userDoc.email,
    subject: "Confirmez votre adresse email — FashionStore",
    text: text,
    html: html,
  });

  if (!sent && !env.isProduction) {
    console.log(`[verify-email] lien pour ${userDoc.email} : ${url}`);
  }

  return sent;
};

module.exports = {
  hashToken,
  setEmailVerificationToken,
  sendVerificationEmail,
  TOKEN_TTL_MS,
};
