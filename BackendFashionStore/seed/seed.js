
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const env = require("../config/env");
const connectDB = require("../config/db");
const { disconnectDB } = require("../config/db");
const clothesModel = require("../Models/clothes");
const userModel = require("../Models/userAuth");
const catalogue = require("./clothes");

const parseArgs = (argv) => ({
  fresh: argv.includes("--fresh"),
  dryRun: argv.includes("--dry-run"),
  admin: argv.includes("--admin"),
});

const seedClothes = async ({ fresh = false, dryRun = false } = {}) => {
  const before = await clothesModel.countDocuments();

  if (dryRun) {
    const existing = await clothesModel.find({}, { id: 1 }).lean();
    const knownIds = new Set(existing.map((doc) => String(doc.id)));
    const toCreate = catalogue.filter((item) => !knownIds.has(item.id)).length;

    return {
      before: before,
      created: toCreate,
      updated: catalogue.length - toCreate,
      deleted: fresh ? before : 0,
      dryRun: true,
    };
  }

  let deleted = 0;
  if (fresh) {
    const result = await clothesModel.deleteMany({});
    deleted = result.deletedCount;
  }

  const operations = catalogue.map((item) => ({
    updateOne: {
      filter: { id: item.id },
      update: { $set: item },
      upsert: true,
    },
  }));

  const result = await clothesModel.bulkWrite(operations, { ordered: false });

  return {
    before: before,
    created: result.upsertedCount,
    updated: result.modifiedCount,
    matched: result.matchedCount,
    deleted: deleted,
    after: await clothesModel.countDocuments(),
  };
};

const seedAdmin = async ({ dryRun = false } = {}) => {
  const { adminEmail, adminPassword, adminFirstName, adminLastName } = env.seed;

  if (!adminEmail || !adminPassword) {
    return {
      skipped: true,
      reason: "SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD absents de .env",
    };
  }

  if (adminPassword.length < 8) {
    return {
      skipped: true,
      reason: "SEED_ADMIN_PASSWORD doit faire au moins 8 caracteres",
    };
  }

  const existing = await userModel.findOne({ email: adminEmail.toLowerCase() });

  if (dryRun) {
    return { dryRun: true, email: adminEmail, created: !existing };
  }

  if (existing) {
    existing.role = "admin";
    existing.isEmailVerified = true;
    await existing.save();

    return { created: false, promoted: true, email: existing.email };
  }

  const created = await userModel.create({
    firstName: adminFirstName,
    lastName: adminLastName,
    email: adminEmail.toLowerCase(),
    phone: "0000000000",
    password: await bcrypt.hash(adminPassword, env.security.bcryptRounds),
    role: "admin",
    isEmailVerified: true,
  });

  return { created: true, email: created.email };
};

const run = async () => {
  const options = parseArgs(process.argv.slice(2));

  await connectDB();
  console.log(`[seed] base : ${mongoose.connection.name}`);

  if (options.fresh && !options.dryRun) {
    console.warn(
      "[seed] --fresh : la collection Clothes est videe. Les commandes et " +
        "wishlists qui referencent un article supprime pointeront dans le vide.",
    );
  }

  const clothesResult = await seedClothes(options);
  console.log(
    `[seed] articles : ${clothesResult.created} crees, ` +
      `${clothesResult.updated} mis a jour, ${clothesResult.deleted} supprimes ` +
      `(total ${clothesResult.after ?? clothesResult.before})` +
      (options.dryRun ? " — DRY RUN, rien n'a ete ecrit" : ""),
  );

  if (options.admin) {
    const adminResult = await seedAdmin(options);
    if (adminResult.skipped) {
      console.warn(`[seed] admin ignore : ${adminResult.reason}`);
    } else if (adminResult.created) {
      console.log(`[seed] admin cree : ${adminResult.email}`);
    } else {
      console.log(`[seed] admin deja present, role confirme : ${adminResult.email}`);
    }
  }

  await disconnectDB();
};

if (require.main === module) {
  run().catch(async (error) => {
    console.error(`[seed] echec : ${error.message}`);
    await disconnectDB().catch(() => {});
    process.exit(1);
  });
}

module.exports = { seedClothes, seedAdmin, catalogue };
