const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// 環境変数をロード
dotenv.config();

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
  res.json({ message: 'トレーニング掲示板APIサーバーが正常に動作しています' });
});

// API/webhookエンドポイント
app.post('/api/ai/webhook', async (req, res) => {
  try {
    const { secret } = req.body;
    
    // Webhookのシークレットキーを検証
    if (secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: '無効なシークレットキーです' });
    }

    res.json({ message: 'Webhook受信: 処理中...' });
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
    env: process.env.NODE_ENV
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