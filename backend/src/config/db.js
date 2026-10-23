import mongoose from 'mongoose';
import dns from 'node:dns';
import { ENV } from './env.js';

// Safe DNS fallback for MongoDB Atlas on Windows/certain ISPs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in environments where setting DNS is restricted
}

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI);
    console.log(`[JanSolve DB] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`[JanSolve DB Error] Failed to connect to MongoDB: ${err.message}`);
    if (ENV.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw err;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[JanSolve DB] MongoDB connection closed');
  } catch (err) {
    console.error('[JanSolve DB Error] Error closing MongoDB connection:', err.message);
  }
};
