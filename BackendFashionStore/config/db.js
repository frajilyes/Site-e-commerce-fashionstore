
const mongoose = require("mongoose");
const env = require("./env");

mongoose.set("bufferTimeoutMS", 10000);
mongoose.set("strictQuery", true);

const connectDB = async ({ silent = false } = {}) => {
  try {
    await mongoose.connect(env.dbUri, {
      serverSelectionTimeoutMS: 10000,
    });

    if (!silent) {
      const { host, name } = mongoose.connection;
      console.log(`[db] connecte a ${host}/${name}`);
    }

    return mongoose.connection;
  } catch (error) {
    console.error(`[db] connexion impossible : ${error.message}`);
    throw error;
  }
};

const disconnectDB = () => mongoose.disconnect();

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.disconnectDB = disconnectDB;
