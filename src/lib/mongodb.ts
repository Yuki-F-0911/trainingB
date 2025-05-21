import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined');
}

export async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  
  return mongoose.connect(MONGODB_URI);
} 