import mongoose from 'mongoose';

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

export default initDB;
