import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

// 環境変数から MongoDB 接続 URI を取得
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local or .env'
  );
}

// Mongoose接続の状態を監視するイベントハンドラーを設定
mongoose.connection.on('connected', () => {
  console.log('Mongoose: Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose: Connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose: Disconnected from MongoDB');
});

// アプリケーション終了時に接続を閉じる
if (typeof window === 'undefined') { // サーバーサイドでのみ実行
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Mongoose: Connection closed due to app termination');
    process.exit(0);
  });
}

// グローバルキャッシュの型定義 (既存の mongooseCache に加えて mongoClientPromise を追加)
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
  // MongoClient の Promise をキャッシュするためのグローバル変数
  // eslint-disable-next-line no-var
  var mongoClientPromise: Promise<MongoClient> | null;
}

// グローバルキャッシュの初期化
if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}
if (!global.mongoClientPromise) {
  global.mongoClientPromise = null;
}

async function dbConnect(): Promise<typeof mongoose> {
  // データベースが既に接続状態にある場合はそれを返す
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  
  // キャッシュされた接続があればそれを返す
  if (global.mongooseCache.conn) {
    return global.mongooseCache.conn;
  }

  // キャッシュされたプロミスがあればそれを待つ
  if (!global.mongooseCache.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // サーバー選択のタイムアウトを5秒に設定
      maxPoolSize: 10, // 最大接続プール数を制限
    };
    
    // 新しい接続プロミスを作成しキャッシュ
    global.mongooseCache.promise = mongoose.connect(MONGODB_URI!, opts);
  }

  try {
    // プロミスを解決し、接続をキャッシュして返す
    global.mongooseCache.conn = await global.mongooseCache.promise;
  } catch (e) {
    // エラーが発生した場合はプロミスを null に戻す
    global.mongooseCache.promise = null;
    console.error('Mongoose connection error:', e);
    throw e;
  }
  
  return global.mongooseCache.conn;
}

// NextAuth アダプター用の MongoClient Promise をエクスポート - シングルトンパターンに変更
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // 開発モードでは、HMR によるモジュール再読み込み後も値を保持するためにグローバル変数を使用
  if (!global.mongoClientPromise) {
    const client = new MongoClient(MONGODB_URI!);
    // 接続時にログ出力を減らす
    global.mongoClientPromise = client.connect()
      .then(client => {
        console.log('MongoDB client connection established');
        return client;
      });
  }
  clientPromise = global.mongoClientPromise;
} else {
  // 本番モードでもシングルトンを使用（Vercel等の環境では重要）
  const client = new MongoClient(MONGODB_URI!);
  clientPromise = client.connect()
    .then(client => {
      console.log('MongoDB client connection established (production)');
      return client;
    });
}

// Mongoose 接続関数をデフォルトエクスポート (既存のコード用)
export default dbConnect;
// MongoClient の Promise を名前付きエクスポート (NextAuth アダプター用)
export { clientPromise }; 