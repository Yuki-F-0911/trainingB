import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/app/lib/db"; // DB接続はここでは不要かも
// import { GoogleGenerativeAI } from '@google/generative-ai'; // No longer used here
// import Question from "@/app/models/Question"; // No longer used here
// import Answer from "@/app/models/Answer";   // No longer used here
import User from "@/app/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { headers } from 'next/headers';
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

// --- AWS SQS Configuration ---
const sqsQueueUrl = process.env.AWS_SQS_QUEUE_URL;
const awsRegion = process.env.AWS_REGION || 'ap-northeast-1';

// SQS Client Initialization
let sqsClient: SQSClient;
if (sqsQueueUrl) {
    sqsClient = new SQSClient({
        region: awsRegion,
        // Credentials should be picked up from Vercel environment variables automatically
    });
} else {
    console.error('起動時エラー: AWS_SQS_QUEUE_URL 環境変数が設定されていません。');
    // sqsClient will be undefined, POST handler should check sqsQueueUrl again
}

// Define interface for the lean result
interface LeanAdminInfo {
  _id: any;
  isAdmin: boolean;
}

// 認証チェック関数
const checkAuthorization = async (req: Request) => {
  // ... (以前修正した認証ロジック) ...
  // CRON jobs should not call this endpoint anymore
  const headersList = headers();
  const authorization = headersList.get('authorization');
  const CRON_SECRET = process.env.CRON_SECRET;
  if (CRON_SECRET && authorization === `Bearer ${CRON_SECRET}`) {
    console.warn('CRONジョブはこのエンドポイントを呼び出すべきではありません。');
    return { authorized: false, isAdmin: false, userId: null };
  }

  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    console.log('セッションが見つかりません');
    return { authorized: false, isAdmin: false, userId: null };
  }

  try {
    const user: LeanAdminInfo | null = await User.findOne({ email: session.user.email }).select('_id isAdmin').lean<LeanAdminInfo>();
    if (!user) {
        console.log('ユーザーが見つかりません:', session.user.email);
        return { authorized: false, isAdmin: false, userId: null };
    }
    if (!user.isAdmin) {
        console.log('管理者権限がありません:', session.user.email);
        return { authorized: false, isAdmin: false, userId: user._id };
    }
    console.log('管理者として認証しました:', session.user.email);
    return { authorized: true, isAdmin: true, userId: user._id };
  } catch(dbError) {
    console.error("ユーザー検索中のDBエラー:", dbError);
    return { authorized: false, isAdmin: false, userId: null };
  }
};

// POST Handler (Sends message to SQS)
export async function POST(request: Request) {
  try {
    const authResult = await checkAuthorization(request);
    if (!authResult.authorized || !authResult.isAdmin) {
      return NextResponse.json(
        { error: "この操作には管理者権限が必要です" },
        { status: 403 }
      );
    }

    // Check again if SQS URL is configured before proceeding
    if (!sqsQueueUrl || !sqsClient) {
        console.error('SQSキューURLが設定されていないか、クライアント初期化に失敗しました。');
        return NextResponse.json({ error: 'サーバー設定エラー (SQS未設定)' }, { status: 500 });
    }

    let requestBody;
    try {
        requestBody = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'リクエストボディのJSON形式が正しくありません' }, { status: 400 });
    }
    const { type = 'question', batchSize = 1, questionId } = requestBody;

    console.log(`AI生成リクエスト受付 (SQSへ送信): タイプ=${type}, バッチ=${batchSize}, QID=${questionId || 'N/A'}`);

    // Validate parameters
     if (type !== 'question' && type !== 'answer') {
       return NextResponse.json({ error: '無効な生成タイプです' }, { status: 400 });
     }
     if (type === 'answer' && !questionId) {
         return NextResponse.json({ error: '回答生成ジョブには questionId が必要です' }, { status: 400 });
     }
     if (type === 'question' && (typeof batchSize !== 'number' || batchSize < 1 || batchSize > 10)) {
         return NextResponse.json({ error: 'バッチサイズは1から10の間で指定してください' }, { status: 400 });
     }

    // SQS Message Payload
    const messagePayload = {
      jobType: type,
      parameters: {
        batchSize: type === 'question' ? batchSize : undefined,
        questionId: type === 'answer' ? questionId : undefined,
        requestedByUserId: authResult.userId?.toString(),
      },
      timestamp: new Date().toISOString(),
    };

    // Send Command
    const sendMessageCommand = new SendMessageCommand({
      QueueUrl: sqsQueueUrl,
      MessageBody: JSON.stringify(messagePayload),
    });

    // Send the message
    try {
      const sqsResponse = await sqsClient.send(sendMessageCommand);
      console.log(`SQSメッセージ送信成功: MessageId=${sqsResponse.MessageId}`);
      return NextResponse.json(
          { message: "AI生成リクエストを受け付けました。バックグラウンドで処理されます。" },
          { status: 202 } // Accepted
      );
    } catch (sqsError: unknown) {
        console.error('SQSメッセージ送信エラー:', sqsError);
        const errorMessage = sqsError instanceof Error ? sqsError.message : 'SQSへの送信に失敗しました';
        return NextResponse.json({ error: `ジョブ送信エラー: ${errorMessage}` }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('/api/ai POST エラー (SQS送信前):', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    let status = 500;
    if (errorMessage.includes('管理者権限')) status = 403;
    else if (errorMessage.includes('認証')) status = 401;
    return NextResponse.json({ error: errorMessage }, { status });
  }
} 