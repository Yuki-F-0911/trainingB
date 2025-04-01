import mongoose from 'mongoose';

// MongoDB接続URIを環境変数から取得
const getMongoURI = () => {
  // 複数の場所から環境変数を取得する試み
  const uri = 
    process.env.MONGODB_URI || 
    (typeof window === 'undefined' ? process.env.MONGODB_URI : null) ||  // サーバーサイド
    (global as any).__MONGODB_URI__ || // グローバル変数
    ''; // フォールバック（空文字）

  // なぜ環境変数が取得できないか診断情報を出力
  if (!uri) {
    console.error('MONGODB_URI環境変数の取得に失敗しました');
    console.error('process.env が存在するか:', typeof process.env !== 'undefined');
    console.error('process.env の種類:', Object.prototype.toString.call(process.env));
    console.error('process.env のキー一覧:', Object.keys(process.env || {}));
  }

  return uri;
};

const MONGODB_URI = getMongoURI();

if (!MONGODB_URI) {
  console.warn('警告: MONGODB_URI環境変数が設定されていません');
}

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;

  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI環境変数が設定されていません');
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB接続成功');
  } catch (error) {
    console.error('MongoDB接続エラー:', error);
    throw error;
  }
} 