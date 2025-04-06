# Training Board 再構築要件

## 1. 概要

ユーザーがマラソンやランニングに関する質問をしたり、AIが生成した質問や回答を閲覧したりできるWebアプリケーション。管理者はAIによる質問・回答の生成をトリガーできる。

## 2. 主要機能

### 2.1. ユーザー認証
- [ ] ユーザー登録機能 (必要であれば)
- [ ] ログイン・ログアウト機能 (メールアドレス/パスワード)
- [ ] セッション管理
- [ ] 管理者権限の判定

### 2.2. 質問 (Question)
- [ ] 質問の投稿機能 (ユーザー)
- [ ] 質問リストの表示 (トップページなど)
    - [ ] ページネーション (必要であれば)
    - [ ] ソート機能 (新着順など)
- [ ] 個別質問ページの表示
    - [ ] 質問内容
    - [ ] 投稿者情報
    - [ ] 投稿日時
    - [ ] 関連する回答リスト

### 2.3. 回答 (Answer)
- [ ] 質問に対する回答の投稿機能 (ユーザー)
- [ ] 回答リストの表示 (個別質問ページ内)
    - [ ] 回答内容
    - [ ] 回答者情報
    - [ ] 回答日時

### 2.4. AI生成機能 (管理者向け)
- [ ] **質問生成:**
    - [ ] 管理画面に生成ボタンを設置
    - [ ] 生成数 (バッチサイズ) を指定可能 (例: 1, 3, 5, 10)
    - [ ] AIパーソナリティをランダムに選択して生成プロンプトに使用
    - [ ] 生成された質問 (タイトル, 内容) をDBに保存 (authorは管理者 or null, isAIGenerated=true)
    - [ ] 生成リクエストの受付、または完了を管理者に通知
- [ ] **回答生成:**
    - [ ] (要件確認) どの質問に対して生成するか？ (例: 特定の質問ページからトリガー)
    - [ ] AIパーソナリティをランダムに選択して生成プロンプトに使用
    - [ ] 生成された回答内容をDBに保存 (questionに対象質問ID, userは管理者 or null, isAIGenerated=true)
    - [ ] 生成リクエストの受付、または完了を管理者に通知

### 2.5. 管理画面
- [ ] AI生成機能を実行するUI
- [ ] (オプション) ユーザー管理機能
- [ ] (オプション) 投稿された質問・回答の管理機能

## 3. データモデル

### 3.1. User
- `email`: String (unique, required)
- `password`: String (hashed, required)
- `name`: String (optional)
- `isAdmin`: Boolean (default: false)
- `createdAt`: Date
- `updatedAt`: Date

### 3.2. Question
- `title`: String (required)
- `content`: String (required)
- `author`: ObjectId (ref: 'User', nullable)
- `answers`: [ObjectId] (ref: 'Answer') - 回答を埋め込むか参照にするか要検討
- `isAIGenerated`: Boolean (default: false)
- `aiPersonality`: String (optional) - AI生成時に使用したパーソナリティ名
- `createdAt`: Date
- `updatedAt`: Date

### 3.3. Answer
- `content`: String (required)
- `question`: ObjectId (ref: 'Question', required)
- `user`: ObjectId (ref: 'User', nullable)
- `isAIGenerated`: Boolean (default: false)
- `aiPersonality`: String (optional) - AI生成時に使用したパーソナリティ名
- `createdAt`: Date
- `updatedAt`: Date

## 4. 技術スタック (推奨)

- **フレームワーク:** Next.js (App Router)
- **言語:** TypeScript
- **UI:** React, Tailwind CSS (shadcn/ui などのコンポーネントライブラリも検討)
- **状態管理:** React Context / Zustand / Jotai (必要に応じて)
- **認証:** NextAuth.js
- **データベース:** MongoDB
- **ODM:** Mongoose
- **AI:** Google Gemini API (`@google/generative-ai`)
- **通知:** `react-hot-toast` または同等のライブラリ
- **フォームハンドリング:** `react-hook-form` (任意)
- **スキーマ検証:** `zod` (任意)

## 5. 非機能要件・懸念事項

- **AI生成の実行時間:** AI APIの応答には時間がかかる可能性があるため、ユーザー体験を損なわない工夫が必要。
    - **案1: APIルートで直接実行 (シンプル):** Vercelの実行時間制限に注意。タイムアウトする場合は延長または別方式へ。
    - **案2: 非同期処理 (堅牢):** Vercel Background Functions / Edge Functions や、外部のキューサービス (SQS+Lambdaなど) を利用。構成は複雑になる。
- **エラーハンドリング:** APIエラー、DBエラー、AI生成エラーなどを適切に処理し、ユーザーにフィードバックする。
- **セキュリティ:** 認証・認可、入力値検証、APIキーの安全な管理。
- **レスポンシブデザイン:** 各種デバイスサイズに対応する。

## 6. その他

- (既存コードからの移行や再利用が必要な部分があれば記述)

---

この内容でよろしいでしょうか？ チェックボックス ([ ]) を使って、実装すべき項目を管理できるようにしています。特に「回答生成」のトリガー方法など、不明確な点は「(要件確認)」と記載しました。 