import mongoose from 'mongoose';

// 環境変数から MongoDB 接続 URI を取得
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local or .env'
  );
}

// グローバル空間に mongoose のキャッシュを保持するための型定義
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

// グローバルキャッシュの初期化 (存在しない場合)
if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  // キャッシュされた接続があればそれを返す
  if (global.mongooseCache.conn) {
    return global.mongooseCache.conn;
  }

  // キャッシュされたプロミスがあればそれを待つ
  if (!global.mongooseCache.promise) {
    const opts = {
      bufferCommands: false, // コネクション確立前にコマンドをバッファリングしない
    };

    // 新しい接続プロミスを作成しキャッシュ
    global.mongooseCache.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    // プロミスを解決し、接続をキャッシュして返す
    global.mongooseCache.conn = await global.mongooseCache.promise;
    console.log('MongoDB connected successfully.'); // 接続成功ログ
  } catch (e) {
    // エラーが発生した場合はプロミスを null に戻す
    global.mongooseCache.promise = null;
    console.error('MongoDB connection error:', e);
    throw e;
  }
  
  return global.mongooseCache.conn;
}

export default dbConnect; 