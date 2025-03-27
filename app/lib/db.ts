import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://s2110052:mrcCD3oL0V2E2wkJ@trainingboard.tsgbk.mongodb.net/training-board?retryWrites=true&w=majority&appName=TrainingBoard';

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectToDatabase() {
  try {
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
      };

      cached.promise = mongoose.connect(MONGODB_URI, opts);
    }

    cached.conn = await cached.promise;
    console.log('データベース接続成功');
    return cached.conn;
  } catch (error) {
    console.error('データベース接続エラー:', error);
    cached.promise = null;
    throw error;
  }
} 