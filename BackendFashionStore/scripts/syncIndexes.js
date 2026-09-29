
const fs = require("fs");
const path = require("path");

const connectDB = require("../config/db");
const { disconnectDB } = require("../config/db");

const loadModels = () => {
  const modelsDir = path.join(__dirname, "..", "Models");

  fs.readdirSync(modelsDir)
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => require(path.join(modelsDir, file)));

  return require("mongoose").models;
};

const run = async () => {
  const checkOnly = process.argv.includes("--check");

  await connectDB();
  const models = loadModels();

  let drift = 0;

  for (const [name, model] of Object.entries(models)) {
    const declared = model.schema.indexes();

    if (checkOnly) {
      const existing = await model.collection.indexes().catch(() => []);
      const existingCount = existing.filter((i) => i.name !== "_id_").length;

      const status = existingCount === declared.length ? "ok" : "DIFFERENT";
      if (status !== "ok") drift += 1;

      console.log(
        `[indexes] ${name.padEnd(12)} declares ${declared.length}, en base ${existingCount} — ${status}`,
      );
      continue;
    }

    const dropped = await model.syncIndexes();

    console.log(
      `[indexes] ${name.padEnd(12)} ${declared.length} index declares` +
        (dropped.length ? `, supprimes : ${dropped.join(", ")}` : ""),
    );
  }

  await disconnectDB();

  if (checkOnly && drift) {
    console.error(
      `[indexes] ${drift} collection(s) desynchronisee(s) — lancer "npm run indexes"`,
    );
    process.exit(1);
  }
};

if (require.main === module) {
  run().catch(async (error) => {
    console.error(`[indexes] echec : ${error.message}`);
    await disconnectDB().catch(() => {});
    process.exit(1);
  });
}

module.exports = { loadModels };
