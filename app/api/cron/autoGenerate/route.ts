import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Question from '@/app/models/Question';
import Answer from '@/app/models/Answer';
import User from '@/app/models/User';
import { headers } from 'next/headers';

// 環境変数からシークレットキーを取得
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * CRONジョブによって呼び出されるエンドポイント
 * 質問と回答の自動生成を行います（軽量化版）
 */
export async function GET(request: Request) {
  try {
    // シークレットキーによる認証
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!CRON_SECRET || authorization !== `Bearer ${CRON_SECRET}`) {
      console.error('CRONジョブ認証エラー: 不正なシークレットキー');
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }
    
    console.log('自動生成CRONジョブ開始:', new Date().toISOString());
    
    // データベースに接続
    await connectToDatabase();
    
    // 処理結果を格納する変数
    const result = {
      generatedQuestions: 0,
      generatedAnswers: 0,
      errors: [] as string[],
    };
    
    // 毎回全ての処理を行うのではなく、ランダムに1つだけ選択して実行
    // これにより処理時間を短縮
    const taskType = Math.floor(Math.random() * 2); // 0または1
    
    try {
      if (taskType === 0) {
        // 質問生成タスク - 1件だけ生成
        console.log('質問の自動生成を開始します（軽量版）');
        
        const questionResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/ai`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${CRON_SECRET}`,
          },
          body: JSON.stringify({
            type: 'question',
            count: 1, // 常に1件だけ
          }),
        });
        
        const questionData = await questionResponse.json();
        
        if (!questionResponse.ok) {
          throw new Error(questionData.error || '質問生成APIエラー');
        }
        
        result.generatedQuestions = questionData.results?.filter((r: any) => r.success).length || 0;
        console.log(`${result.generatedQuestions}件の質問を生成しました`);
      } else {
        // 回答生成タスク - 1件だけ生成
        console.log('回答の自動生成を開始します（軽量版）');
        
        // 回答がまだない質問の件数を確認
        const answeredQuestionIds = await Answer.distinct('question');
        const unansweredQuestionsCount = await Question.countDocuments({
          _id: { $nin: answeredQuestionIds }
        });
        
        if (unansweredQuestionsCount > 0) {
          const answerResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/autoAnswer`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'authorization': `Bearer ${CRON_SECRET}`,
            },
            body: JSON.stringify({
              limit: 1, // 常に1件だけ
            }),
          });
          
          const answerData = await answerResponse.json();
          
          if (!answerResponse.ok) {
            throw new Error(answerData.error || '回答生成APIエラー');
          }
          
          result.generatedAnswers = answerData.results?.filter((r: any) => r.success).length || 0;
          console.log(`${result.generatedAnswers}件の回答を生成しました`);
        } else {
          console.log('回答が必要な質問はありません');
        }
      }
    } catch (error: any) {
      const errorMessage = `自動生成エラー: ${error.message}`;
      console.error(errorMessage);
      result.errors.push(errorMessage);
    }
    
    return NextResponse.json({
      success: true,
      message: '自動生成処理が完了しました',
      timestamp: new Date().toISOString(),
      ...result,
    });
    
  } catch (error: any) {
    console.error('自動生成CRONジョブエラー:', error);
    return NextResponse.json({
      error: error.message || '自動生成処理中にエラーが発生しました',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Vercelの定期実行を確実にするためのディレクティブ
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 300から60に変更（Hobbyプランの上限） 