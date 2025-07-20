import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/docverify';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Define the connection cache type
interface ConnectionCache {
  isConnected?: number;
}

// Global connection cache
const connection: ConnectionCache = {};

async function dbConnect() {
  if (connection.isConnected) {
    // Use existing database connection
    return;
  }

  // Use new database connection
  try {
    const db = await mongoose.connect(MONGODB_URI);
    connection.isConnected = db.connections[0].readyState;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default dbConnect; 