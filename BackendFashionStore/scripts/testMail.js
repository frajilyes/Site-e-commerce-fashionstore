
const crypto = require("crypto");
const env = require("../config/env");
const { sendMail, verifyMailer } = require("../Utils/mailer");
const { sendVerificationEmail } = require("../Utils/emailVerification");

const mask = (value) =>
  !value ? "(vide)" : `${value.slice(0, 2)}${"*".repeat(Math.max(0, value.length - 2))}`;

const arg = (name) => {
  const index = process.argv.indexOf(name);
  return index !== -1 ? process.argv[index + 1] : null;
};

const run = async () => {
  const verifyOnly = process.argv.includes("--verify-only");
  const useTemplate = process.argv.includes("--template");
  const to = arg("--to") || env.mail.user;

  console.log("[mail] configuration :");
  console.log(`       host     ${env.mail.host || "(vide)"}`);
  console.log(`       port     ${env.mail.port}  (secure: ${env.mail.port === 465})`);
  console.log(`       user     ${env.mail.user || "(vide)"}`);
  console.log(`       pass     ${mask(env.mail.pass)}`);
  console.log(`       from     ${env.mail.from}`);
  console.log(`       lien     ${env.clientUrl}/verify-email?token=...`);

  if (!env.mail.isConfigured) {
    console.error(
      "\n[mail] SMTP incomplet : renseigner SMTP_HOST, SMTP_USER et SMTP_PASS " +
        "dans .env.\n       En l'etat, l'API n'envoie rien et ecrit les liens " +
        "de confirmation dans sa console.",
    );
    process.exit(1);
  }

  console.log("\n[mail] connexion au serveur SMTP...");
  await verifyMailer();
  console.log("[mail] connexion et identifiants acceptes");

  if (verifyOnly) return;

  if (!to) {
    throw new Error("aucun destinataire : utiliser --to <adresse>");
  }

  if (useTemplate) {
    const fakeUser = { firstName: "Test", email: to };
    await sendVerificationEmail(fakeUser, crypto.randomBytes(32).toString("hex"));
    console.log(`[mail] email de confirmation envoye a ${to}`);
    return;
  }

  await sendMail({
    to: to,
    subject: "Test SMTP — FashionStore",
    text:
      "Si vous lisez ceci, la configuration SMTP du backend FashionStore " +
      `fonctionne.\nEnvironnement : ${env.nodeEnv}\nDate : ${new Date().toISOString()}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#111">
        <h2 style="margin:0 0 16px">Test SMTP reussi</h2>
        <p>La configuration SMTP du backend FashionStore fonctionne.</p>
        <p style="font-size:13px;color:#555">
          Environnement : ${env.nodeEnv}<br>
          Date : ${new Date().toISOString()}
        </p>
      </div>`,
  });

  console.log(`[mail] email de test envoye a ${to}`);
};

if (require.main === module) {
  run().catch((error) => {
    console.error(`[mail] echec : ${error.message}`);
    process.exit(1);
  });
}

module.exports = { run };
