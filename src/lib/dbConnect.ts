import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

// 環境変数から MongoDB 接続 URI を取得
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local or .env'
  );
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
  // キャッシュされた接続があればそれを返す
  if (global.mongooseCache.conn) {
    console.log('Using cached Mongoose connection.');
    return global.mongooseCache.conn;
  }

  // キャッシュされたプロミスがあればそれを待つ
  if (!global.mongooseCache.promise) {
    const opts = {
      bufferCommands: false, // コネクション確立前にコマンドをバッファリングしない
    };
    console.log('Creating new Mongoose connection promise.');
    // 新しい接続プロミスを作成しキャッシュ
    global.mongooseCache.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    // プロミスを解決し、接続をキャッシュして返す
    global.mongooseCache.conn = await global.mongooseCache.promise;
    console.log('Mongoose connected successfully.'); // 接続成功ログ
  } catch (e) {
    // エラーが発生した場合はプロミスを null に戻す
    global.mongooseCache.promise = null;
    console.error('Mongoose connection error:', e);
    throw e;
  }
  
  return global.mongooseCache.conn;
}

// NextAuth アダプター用の MongoClient Promise をエクスポート
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const options = {}; // 必要に応じて MongoClient のオプションを追加

if (process.env.NODE_ENV === 'development') {
  // 開発モードでは、HMR によるモジュール再読み込み後も値を保持するためにグローバル変数を使用
   if (!global.mongoClientPromise) {
       client = new MongoClient(MONGODB_URI!, options);
       global.mongoClientPromise = client.connect();
       console.log('Creating new MongoClient connection promise (development).');
   }
   clientPromise = global.mongoClientPromise;
} else {
  // 本番モードではグローバル変数を使用しない
  client = new MongoClient(MONGODB_URI!, options);
  clientPromise = client.connect();
  console.log('Creating new MongoClient connection promise (production).');
}

// Mongoose 接続関数をデフォルトエクスポート (既存のコード用)
export default dbConnect;
// MongoClient の Promise を名前付きエクスポート (NextAuth アダプター用)
export { clientPromise }; 