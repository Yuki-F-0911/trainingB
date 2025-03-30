const express = require('express');
const cors = require('cors');

// Expressアプリケーションを作成
const app = express();

// CORS設定
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Content-Type設定
app.use(express.json());

// ルートパスのハンドラー
app.get('/', (req, res) => {
  res.json({ 
    message: 'トレーニング掲示板APIサーバーが正常に動作しています',
    env: process.env.NODE_ENV || 'development'
  });
});

// API/webhookエンドポイント
app.post('/api/ai/webhook', async (req, res) => {
  try {
    console.log('Webhook呼び出し受信:', req.body);
    const { secret } = req.body || {};
    
    // Webhookのシークレットキーを検証
    if (secret !== process.env.WEBHOOK_SECRET) {
      console.log('無効なシークレット:', secret);
      return res.status(401).json({ 
        error: '無効なシークレットキーです',
        receivedSecret: secret,
        expectedSecret: process.env.WEBHOOK_SECRET ? '[設定済み]' : '[未設定]'
      });
    }

    console.log('Webhook認証成功');
    res.json({ 
      message: 'Webhook受信: 処理中...',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Webhookエラー:', error);
    res.status(500).json({ error: error.message || 'エラーが発生しました' });
  }
});

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// 環境変数確認エンドポイント（デバッグ用）
app.get('/debug/env', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV || 'not set',
    webhookSecret: process.env.WEBHOOK_SECRET ? '[設定済み]' : '[未設定]',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasMongoUri: !!process.env.MONGODB_URI
  });
});

// 404ハンドラー
app.use((req, res) => {
  console.log(`404エラー: パス ${req.path} が見つかりません`);
  res.status(404).json({ 
    message: 'リクエストされたリソースが見つかりません',
    path: req.path,
    method: req.method
  });
});

// サーバーレス環境でモジュールをエクスポート
module.exports = app; 