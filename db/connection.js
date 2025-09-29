const mongoose = require("mongoose");

let isConnected = false;

async function initDB(uri) {
  if (isConnected) return mongoose.connection;

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  isConnected = true;
  console.log("✅ MongoDB connected");
  return mongoose.connection;
}

module.exports = { initDB };
