
const env = require("./config/env");
const { logEnvWarnings } = require("./config/env");
const connectDB = require("./config/db");
const app = require("./app");

let server = null;

const start = async () => {
  logEnvWarnings();

  await connectDB();

  server = app.listen(env.port, () => {
    console.log(`[server] http://localhost:${env.port} (${env.nodeEnv})`);
  });

  server.headersTimeout = 20 * 1000;
  server.requestTimeout = 60 * 1000;
  server.keepAliveTimeout = 65 * 1000;
  server.maxRequestsPerSocket = 1000;
};

const shutdown = async (signal) => {
  console.log(`\n[server] ${signal} recu, arret en cours...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  const { disconnectDB } = require("./config/db");
  await disconnectDB();

  console.log("[server] arrete proprement");
  process.exit(0);
};

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    shutdown(signal).catch((error) => {
      console.error(error);
      process.exit(1);
    });
  });
});

process.on("unhandledRejection", (reason) => {
  console.error("[server] promesse rejetee sans traitement :", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("[server] exception non capturee :", error);
  process.exit(1);
});

start().catch((error) => {
  console.error(`[server] demarrage impossible : ${error.message}`);
  process.exit(1);
});
