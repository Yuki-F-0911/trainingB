const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Expressアプリケーションを作成
const app = express();

// CORS設定
app.use(cors({
  origin: [
    'https://training-b.vercel.app',
    'https://training-board.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));

// Content-Type設定
app.use(express.json());

// APIルート
app.get('/api', (req, res) => {
  res.json({ 
    message: 'APIルートが正常に動作しています',
    endpoints: {
      webhook: '/api/ai/webhook',
      questions: '/api/questions',
      health: '/health',
      debug: '/debug/env'
    }
  });
});

// 質問一覧エンドポイント
app.get('/api/questions', async (req, res) => {
  try {
    console.log('質問一覧リクエスト受信');
    
    // クライアントアプリのAPIを呼び出して質問一覧を取得
    const clientUrl = process.env.CLIENT_URL || 'https://training-b.vercel.app';
    const response = await axios.get(`${clientUrl}/api/questions`);
    
    console.log('クライアントから質問データ取得成功');
    res.json(response.data);
  } catch (error) {
    console.error('質問一覧取得エラー:', error);
    
    // エラーレスポンスを返す
    res.status(502).json({ 
      error: 'クライアントアプリからの質問データ取得に失敗しました',
      message: error.message || 'サーバーエラーが発生しました',
      timestamp: new Date().toISOString()
    });
  }
});

// ルートパスのハンドラー
app.get('/', (req, res) => {
  res.json({ 
    message: 'トレーニング掲示板APIサーバーが正常に動作しています',
    env: process.env.NODE_ENV || 'development'
  });
});

// API/webhookエンドポイント
app.get('/api/ai/webhook', (req, res) => {
  console.log('Webhook GET リクエスト受信');
  res.json({
    status: 'ok',
    message: 'AI Webhook API エンドポイントが正常に動作しています',
    details: 'このエンドポイントはPOSTリクエストでWebhookを受け付けています',
    usage: 'POSTリクエストで { "secret": "your_webhook_secret" } を送信してください'
  });
});

// 二重パスのGETリクエストにも対応
app.get('/api/api/ai/webhook', (req, res) => {
  console.log('二重パス Webhook GET リクエスト受信');
  res.json({
    status: 'ok',
    message: 'AI Webhook API エンドポイント（二重パス）が正常に動作しています',
    details: 'このエンドポイントはPOSTリクエストでWebhookを受け付けています',
    usage: 'POSTリクエストで { "secret": "your_webhook_secret" } を送信してください'
  });
});

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

// 二重パスの問題を解決するために、/api/api/ai/webhookも同じ処理を行うように追加
app.post('/api/api/ai/webhook', async (req, res) => {
  try {
    console.log('二重パスWebhook呼び出し受信:', req.body);
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