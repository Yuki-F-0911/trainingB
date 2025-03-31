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
    console.log('質問一覧リクエスト受信', req.query);
    
    // ページネーションパラメータを取得
    const page = req.query.page || 1;
    const limit = req.query.limit || 9;
    
    // クライアントアプリのAPIを呼び出して質問一覧を取得
    const clientUrl = process.env.CLIENT_URL || 'https://training-b.vercel.app';
    const response = await axios.get(`${clientUrl}/api/questions`, {
      params: { 
        page: page,
        limit: limit
      }
    });
    
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

// 質問詳細エンドポイント
app.get('/api/questions/:id', async (req, res) => {
  try {
    console.log(`質問詳細リクエスト受信: ID=${req.params.id}`);
    
    // フォールバックデータを用意
    const mockQuestion = {
      id: req.params.id,
      title: 'マラソン初心者のためのトレーニング計画',
      content: 'マラソンを始めたばかりで、どのようにトレーニングを進めるべきか悩んでいます。最初は何キロから走り始めて、どのように距離を伸ばしていくのがベストでしょうか？また、週に何回走るのが適切ですか？初心者向けのトレーニング計画があれば教えてください。',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAIGenerated: true,
      personality: '市民ランナー',
      tags: ['マラソン', '初心者', 'トレーニング'],
      author: { name: 'AI Assistant' },
      _count: { answers: 1 }
    };
    
    // モックの回答データ
    const mockAnswers = [
      {
        id: 'answer-1',
        content: 'マラソン初心者の方へのアドバイスです。\n\n初めてのマラソンに挑戦するなら、まずは短い距離から始めましょう。最初の2週間は2〜3kmを週3回のペースで走ることをお勧めします。この期間は体を慣らすことが目的なので、スピードよりも継続することを重視してください。\n\n3週目からは少しずつ距離を伸ばしていきましょう。週3〜4回のペースで、1回のトレーニングで3〜5kmを目指します。この時点でも無理はせず、必要に応じて歩くことも大切です。\n\n1ヶ月後からは、週に1回の「長距離日」を設けると効果的です。他の日は短い距離でも、週末などに1回だけ他の日より長い距離（最初は7〜8km程度）に挑戦します。\n\n怪我を防ぐためにも、距離は毎週10%以上増やさないようにしましょう。また、筋力トレーニングやストレッチも取り入れると、走る能力が向上し、怪我のリスクも減らせます。\n\n最も大切なのは楽しむことと継続することです。無理なく続けられるペースで進めましょう！',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAIGenerated: true,
        personality: '専門家',
        author: { name: 'トレーニング専門家' }
      }
    ];
    
    try {
      // まずクライアントアプリのAPIを呼び出して質問詳細を取得
      const clientUrl = process.env.CLIENT_URL || 'https://training-b.vercel.app';
      const response = await axios.get(`${clientUrl}/api/questions/${req.params.id}`);
      
      console.log('クライアントから質問詳細データ取得成功');
      res.json(response.data);
    } catch (apiError) {
      // クライアントAPIからの取得が失敗した場合、モックデータを返す
      console.log('クライアントAPIからの取得失敗、モックデータを返します:', apiError.message);
      
      res.json({
        question: mockQuestion,
        answers: mockAnswers
      });
    }
  } catch (error) {
    console.error('質問詳細取得エラー:', error);
    
    // エラーレスポンスを返す
    if (error.response && error.response.status === 404) {
      res.status(404).json({ 
        error: '質問が見つかりません',
        message: '指定されたIDの質問は存在しません',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ 
        error: '質問詳細データの取得に失敗しました',
        message: error.message || 'サーバーエラーが発生しました',
        timestamp: new Date().toISOString()
      });
    }
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

    console.log('Webhook認証成功 - 処理を開始します');
    
    // 成功レスポンスを直接返す（クライアント側の処理を待たない）
    res.json({ 
      message: 'Webhook処理を受け付けました。バックグラウンドで処理を実行します。',
      timestamp: new Date().toISOString() 
    });
    
    // バックグラウンドでクライアント側Webhookを呼び出す試行
    try {
      const clientUrl = process.env.CLIENT_URL || 'https://training-b.vercel.app';
      const clientWebhookUrl = `${clientUrl}/api/ai/webhook`;
      
      console.log(`クライアントWebhookへの転送: ${clientWebhookUrl}`);
      
      // タイムアウトを設定して確実にレスポンスを得る
      const clientResponse = await axios.post(clientWebhookUrl, { 
        secret: process.env.WEBHOOK_SECRET 
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10秒でタイムアウト
      });
      
      console.log('クライアント応答:', clientResponse.data);
      // レスポンスはすでに返しているので、ここでは何もしない
    } catch (clientError) {
      console.error('クライアントWebhook呼び出しエラー:', clientError.message);
      
      if (clientError.response) {
        console.error('クライアント応答詳細:', {
          status: clientError.response.status,
          data: clientError.response.data
        });
      } else if (clientError.request) {
        console.error('レスポンスが受信できませんでした (タイムアウトの可能性)');
      }
      
      // クライアント側処理が失敗したことをログに記録するだけ
      // レスポンスはすでに返しているので、ここでは何もしない
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

    console.log('Webhook認証成功 - 処理を開始します');
    
    // 成功レスポンスを直接返す（クライアント側の処理を待たない）
    res.json({ 
      message: 'Webhook処理を受け付けました。バックグラウンドで処理を実行します。',
      timestamp: new Date().toISOString() 
    });
    
    // バックグラウンドでクライアント側Webhookを呼び出す試行
    try {
      const clientUrl = process.env.CLIENT_URL || 'https://training-b.vercel.app';
      const clientWebhookUrl = `${clientUrl}/api/ai/webhook`;
      
      console.log(`クライアントWebhookへの転送: ${clientWebhookUrl}`);
      
      // タイムアウトを設定して確実にレスポンスを得る
      const clientResponse = await axios.post(clientWebhookUrl, { 
        secret: process.env.WEBHOOK_SECRET 
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10秒でタイムアウト
      });
      
      console.log('クライアント応答:', clientResponse.data);
      // レスポンスはすでに返しているので、ここでは何もしない
    } catch (clientError) {
      console.error('クライアントWebhook呼び出しエラー:', clientError.message);
      
      if (clientError.response) {
        console.error('クライアント応答詳細:', {
          status: clientError.response.status,
          data: clientError.response.data
        });
      } else if (clientError.request) {
        console.error('レスポンスが受信できませんでした (タイムアウトの可能性)');
      }
      
      // クライアント側処理が失敗したことをログに記録するだけ
      // レスポンスはすでに返しているので、ここでは何もしない
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