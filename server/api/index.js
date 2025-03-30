const express = require('express');
const cors = require('cors');
const axios = require('axios');

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

    console.log('Webhook認証成功 - クライアントAPIへ転送中');
    
    // 成功したら、クライアント側のWebhookエンドポイントに転送
    try {
      const clientUrl = process.env.CLIENT_URL || 'https://training-b.vercel.app';
      const clientWebhookUrl = `${clientUrl}/api/ai/webhook`;
      
      console.log(`クライアントWebhookへの転送: ${clientWebhookUrl}`);
      
      const clientResponse = await axios.post(clientWebhookUrl, { 
        secret: process.env.WEBHOOK_SECRET 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('クライアント応答:', clientResponse.data);
      
      res.json({ 
        message: 'Webhook処理完了: クライアント側で質問と回答が生成されました',
        clientResponse: clientResponse.data,
        timestamp: new Date().toISOString() 
      });
    } catch (clientError) {
      console.error('クライアントWebhook呼び出しエラー:', clientError);
      
      if (clientError.response) {
        console.error('クライアント応答詳細:', {
          status: clientError.response.status,
          data: clientError.response.data
        });
      }
      
      res.status(502).json({ 
        error: 'クライアントWebhookの呼び出しに失敗しました',
        details: clientError.message,
        timestamp: new Date().toISOString() 
      });
    }
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
    hasMongoUri: !!process.env.MONGODB_URI,
    clientUrl: process.env.CLIENT_URL || 'https://training-b.vercel.app'
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