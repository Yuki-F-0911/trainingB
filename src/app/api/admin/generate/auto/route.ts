import { NextResponse } from 'next/server';

// ランダムな待機時間を生成するヘルパー関数 (ミリ秒)
// function getRandomDelay(minSeconds: number, maxSeconds: number): number {
//   return Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000;
// }
// この関数は不要になったので削除

// 内部APIを呼び出す関数
async function callInternalApi(endpoint: string, body: object) {
    // Next.jsのAPIルートでは、絶対URLまたは Vercel 環境変数を指定する必要がある
    // ローカル開発時と Vercel デプロイ時で動作するように調整
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` // Vercel環境変数 (公開用)
        : process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}` // Vercel環境変数 (内部用)
            : 'http://localhost:3000'; // ローカル開発用フォールバック
    const url = `${baseUrl}${endpoint}`;

    console.log(`[Auto Generate] Calling internal API: ${url} with body:`, body);

    try {
        // fetchの第二引数に cache: 'no-store' を追加してキャッシュを無効化
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // TODO: 必要であれば認証ヘッダーなどを追加 (例: APIキーなど)
                // 'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
            },
            body: JSON.stringify(body),
            cache: 'no-store', // Cron Jobからの呼び出しではキャッシュを無効にする
        });

        const responseBody = await response.text(); // レスポンスボディを先に取得
        console.log(`[Auto Generate] Response from ${url}: Status ${response.status}, Body: ${responseBody.substring(0, 100)}...`); // ログは短縮

        if (!response.ok) {
            let errorDetails = responseBody;
            try {
                const errorJson = JSON.parse(responseBody);
                errorDetails = errorJson.message || JSON.stringify(errorJson);
            } catch (parseError) {
                // パース失敗時はテキストのまま
            }
            // Vercelのログで確認しやすいようにエラー情報を付加
            throw new Error(`Failed to call ${endpoint}. Status: ${response.status}. URL: ${url}. Details: ${errorDetails}`);
        }

        try {
            return JSON.parse(responseBody);
        } catch (e) {
            // 成功したがJSONでない場合 (例: メッセージのみの成功応答)
            return { message: responseBody };
        }

    } catch (error: any) {
        console.error(`[Auto Generate] Error calling internal API ${endpoint}:`, error);
        // エラー情報をより詳細に含めて再スロー
        throw new Error(`Error in callInternalApi for ${endpoint} (URL: ${url}): ${error.message}`);
    }
}

// GETリクエストで実行 (Vercel CronはGETを想定)
export async function GET(request: Request) {
  // セキュリティ向上のため、特定のヘッダーやトークンでリクエスト元を検証することを推奨
  // 例: const secret = request.headers.get('x-cron-secret');
  // if (secret !== process.env.CRON_SECRET) {
  //   console.warn('[Auto Generate] Unauthorized cron request detected.');
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  // }

  console.log("[Auto Generate] Job started via GET request...");

  try {
    // --- 質問生成 ---
    // const questionDelay = getRandomDelay(5, 30); // 削除
    // console.log(`[Auto Generate] Waiting ${questionDelay / 1000} seconds before generating questions...`); // 削除
    // await new Promise(resolve => setTimeout(resolve, questionDelay)); // 削除

    console.log("[Auto Generate] Generating 1 question...");
    const questionResult = await callInternalApi('/api/admin/generate/questions', { count: 1 });
    console.log("[Auto Generate] Question generation result:", questionResult);

    // --- 回答生成 ---
    // const answerDelay = getRandomDelay(10, 60); // 削除
    // console.log(`[Auto Generate] Waiting ${answerDelay / 1000} seconds before generating answers...`); // 削除
    // await new Promise(resolve => setTimeout(resolve, answerDelay)); // 削除

    console.log("[Auto Generate] Generating 3 answers...");
    // 回答生成APIは回答が必要な質問を選ぶロジックを持っている想定
    const answerResult = await callInternalApi('/api/admin/generate/answers', { count: 3 });
    console.log("[Auto Generate] Answer generation result:", answerResult);

    console.log("[Auto Generate] Job finished successfully.");
    return NextResponse.json({
        message: 'Auto generation process completed successfully.',
        questionResult,
        answerResult,
    }, { status: 200 }); // 成功ステータスを明示

  } catch (error: any) {
    console.error('[Auto Generate] Job failed:', error);
    // エラーレスポンスにも詳細を含める
    return NextResponse.json({
        message: `Auto generation failed: ${error.message}`,
        // error: error // デバッグ用にエラーオブジェクト全体を含めることも検討
    }, { status: 500 }); // エラーステータスを明示
  }
} 