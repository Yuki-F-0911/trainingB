import express from 'express';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import { errorHandler } from './middleware/error';
import authRoutes from './routes/auth';
import questionRoutes from './routes/questions';
import aiRoutes from './routes/ai';
import bookmarkRoutes from './routes/bookmarks';
// import { startAutoPostJob } from './jobs/autoPost';

// Load environment variables
dotenv.config();

// アプリケーションインスタンスをグローバルに定義
const app = express();

// データベース接続状態を追跡
let isConnected = false;

// リクエストログ
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// CORS設定 - クライアントドメインを明示的に許可
app.use(cors({
  origin: [
    'https://training-board-client2.vercel.app',
    'https://training-board-client.vercel.app',
    'https://training-board.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));

// Content-Type設定
app.use(express.json());

// favicon.icoへのリクエストを処理
app.get('/favicon.ico', (req, res) => {
  console.log('Favicon.icoリクエスト受信');
  res.status(204).end(); // 204 No Content
});

// データベース接続を確保するミドルウェア
const dbMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!isConnected) {
    try {
      console.log('データベース接続を開始します: ', process.env.MONGODB_URI);
      await connectDB();
      console.log('データベース接続が成功しました');
      isConnected = true;
      
      // AIユーザーの作成または取得
      try {
        const User = mongoose.model('User');
        await User.findOneAndUpdate(
          { email: 'ai@training-board.com' },
          {
            username: 'AI Assistant',
            email: 'ai@training-board.com',
            password: require('crypto').randomBytes(32).toString('hex'),
          },
          { upsert: true, new: true }
        );
        console.log('AIユーザーを準備しました');
      } catch (error) {
        console.error('AIユーザー作成中に例外が発生しました:', error);
      }
    } catch (error) {
      console.error('データベース接続の初期化に失敗しました:', error);
      return res.status(500).json({ message: 'データベースに接続できませんでした' });
    }
  }
  next();
};
app.use(dbMiddleware as any);

// ルート
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/ai', aiRoutes);

// ルートパスのハンドラー
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'トレーニング掲示板APIサーバーが正常に動作しています' });
});

// APIパスのハンドラー - デバッグ用
app.get('/api', (req: Request, res: Response) => {
  res.json({ 
    message: 'APIルートが正常に動作しています',
    endpoints: {
      auth: '/api/auth',
      questions: '/api/questions',
      bookmarks: '/api/bookmarks',
      ai: '/api/ai'
    }
  });
});

// ヘルスチェックエンドポイント
app.get('/health', (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus: Record<number, string> = {
    0: '切断済み',
    1: '接続済み',
    2: '接続中',
    3: '切断中',
  };
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    db: dbStatus[dbState] || '不明',
    env: process.env.NODE_ENV
  });
});

// 404ハンドラー - 一致するルートがない場合
app.use((req: Request, res: Response) => {
  console.log(`404エラー: パス ${req.path} が見つかりません`);
  res.status(404).json({ 
    message: 'リクエストされたリソースが見つかりません',
    path: req.path,
    method: req.method
  });
});

// エラーハンドラー
app.use(errorHandler as any);

// サーバーレス環境でモジュールをエクスポート
module.exports = app; 