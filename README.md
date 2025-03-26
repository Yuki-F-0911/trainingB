# Training Board

トレーニングに関する質問と回答を共有するプラットフォーム

## 機能

- ユーザー認証（登録・ログイン）
- 質問の投稿・編集・削除
- 回答の投稿・編集・削除
- AIによる質問と回答の自動生成
- タグによる質問の分類
- 投票システム

## 技術スタック

- Next.js
- TypeScript
- MongoDB
- Chakra UI
- Google Gemini AI

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 環境変数

以下の環境変数を`.env`ファイルに設定してください：

```
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GEMINI_API_KEY=
```

## デプロイ

このプロジェクトはVercelにデプロイされています。
