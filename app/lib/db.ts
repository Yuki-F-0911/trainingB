import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    'MONGODB_URIが設定されていません。環境変数MONGODB_URIを設定してください。'
  );
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectToDatabase() {
  try {
    if (cached.conn) {
      console.log('既存のデータベース接続を使用');
      return cached.conn;
    }

    if (!cached.promise) {
      console.log('新しいデータベース接続を開始');
      const opts = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
        retryWrites: true,
      };

      cached.promise = mongoose.connect(MONGODB_URI, opts);
    }

    cached.conn = await cached.promise;
    console.log('データベース接続成功');
    return cached.conn;
  } catch (error) {
    console.error('データベース接続エラー:', error);
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
} 