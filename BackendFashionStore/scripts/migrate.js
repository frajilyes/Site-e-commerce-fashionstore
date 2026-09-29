
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const { disconnectDB } = require("../config/db");
const userModel = require("../Models/userAuth");
const orderModel = require("../Models/order");
const clothesModel = require("../Models/clothes");
const reviewModel = require("../Models/review");

const buildOrderNumber = () =>
  `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

const migrations = [
  {
    name: "001-users-provider-default",
    description:
      "provider: 'local' sur les comptes crees avant l'arrivee de Google Sign-In",
    count: () => userModel.countDocuments({ provider: { $exists: false } }),
    up: async () => {
      const result = await userModel.updateMany(
        { provider: { $exists: false } },
        { $set: { provider: "local" } },
      );
      return result.modifiedCount;
    },
  },
  {
    name: "002-users-verify-legacy-accounts",
    description:
      "isEmailVerified: true sur les comptes anterieurs a la confirmation " +
      "d'email — sans quoi ils ne pourraient plus se connecter",
    count: () => userModel.countDocuments({ isEmailVerified: { $exists: false } }),
    up: async () => {
      const result = await userModel.updateMany(
        { isEmailVerified: { $exists: false } },
        { $set: { isEmailVerified: true } },
      );
      return result.modifiedCount;
    },
  },
  {
    name: "003-users-drop-legacy-address",
    description:
      "supprime les champs d'adresse restes sur User : l'adresse de livraison " +
      "est portee par Payement.shipping et OrderReview.ShippingAddress",
    count: () =>
      userModel.countDocuments({
        $or: [
          { address: { $exists: true } },
          { shippingAddress: { $exists: true } },
          { fullName: { $exists: true } },
        ],
      }),
    up: async () => {
      const result = await userModel.updateMany(
        {
          $or: [
            { address: { $exists: true } },
            { shippingAddress: { $exists: true } },
            { fullName: { $exists: true } },
          ],
        },
        { $unset: { address: "", shippingAddress: "", fullName: "" } },
      );
      return result.modifiedCount;
    },
  },
  {
    name: "004-orders-backfill-order-number",
    description:
      "genere un orderNumber sur les commandes qui n'en ont pas (le champ est " +
      "devenu obligatoire et unique)",
    count: () =>
      orderModel.countDocuments({
        $or: [{ orderNumber: { $exists: false } }, { orderNumber: null }, { orderNumber: "" }],
      }),
    up: async () => {
      const orphans = await orderModel
        .find({
          $or: [
            { orderNumber: { $exists: false } },
            { orderNumber: null },
            { orderNumber: "" },
          ],
        })
        .select("_id");

      for (const doc of orphans) {
        await orderModel.updateOne(
          { _id: doc._id },
          { $set: { orderNumber: buildOrderNumber() } },
        );
      }

      return orphans.length;
    },
  },
  {
    name: "005-clothes-id-as-string",
    description:
      "convertit Clothes.id en chaine : le schema le declare String, un import " +
      "ancien a pu y laisser des nombres, que l'index unique traite a part",
    count: () => clothesModel.countDocuments({ id: { $type: "number" } }),
    up: async () => {
      const numeric = await clothesModel
        .find({ id: { $type: "number" } })
        .select("_id id")
        .lean();

      for (const doc of numeric) {
        await clothesModel.collection.updateOne(
          { _id: doc._id },
          { $set: { id: String(doc.id) } },
        );
      }

      return numeric.length;
    },
  },
  {
    name: "006-clothes-resync-ratings",
    description:
      "recalcule rating et reviews a partir de la collection Review pour les " +
      "articles qui ont recu au moins un avis",
    count: async () => {
      const ids = await reviewModel.distinct("clothes");
      return ids.length;
    },
    up: async () => {
      const ids = await reviewModel.distinct("clothes");

      for (const id of ids) {
        await reviewModel.syncClothesRating(id);
      }

      return ids.length;
    },
  },
];

const ledger = () => mongoose.connection.collection("migrations");

const appliedNames = async () => {
  const rows = await ledger().find({}, { projection: { name: 1 } }).toArray();
  return new Set(rows.map((row) => row.name));
};

const run = async () => {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const listOnly = argv.includes("--list");
  const onlyIndex = argv.indexOf("--only");
  const only = onlyIndex !== -1 ? argv[onlyIndex + 1] : null;

  await connectDB();
  const applied = await appliedNames();

  if (listOnly) {
    for (const migration of migrations) {
      const pending = await migration.count();
      console.log(
        `[migrate] ${applied.has(migration.name) ? "applique " : "EN ATTENTE"} ` +
          `${migration.name} — ${pending} document(s) concerne(s)\n` +
          `          ${migration.description}`,
      );
    }
    await disconnectDB();
    return;
  }

  const selected = only
    ? migrations.filter((migration) => migration.name === only)
    : migrations.filter((migration) => !applied.has(migration.name));

  if (only && !selected.length) {
    throw new Error(`migration inconnue : ${only}`);
  }

  if (!selected.length) {
    console.log("[migrate] rien a faire, la base est a jour");
    await disconnectDB();
    return;
  }

  for (const migration of selected) {
    if (dryRun) {
      const pending = await migration.count();
      console.log(
        `[migrate] DRY RUN ${migration.name} — ${pending} document(s) seraient modifies`,
      );
      continue;
    }

    const changed = await migration.up();

    await ledger().updateOne(
      { name: migration.name },
      {
        $set: {
          name: migration.name,
          description: migration.description,
          changed: changed,
          appliedAt: new Date(),
        },
      },
      { upsert: true },
    );

    console.log(`[migrate] ${migration.name} — ${changed} document(s) modifies`);
  }

  await disconnectDB();
};

if (require.main === module) {
  run().catch(async (error) => {
    console.error(`[migrate] echec : ${error.message}`);
    await disconnectDB().catch(() => {});
    process.exit(1);
  });
}

module.exports = { migrations };
