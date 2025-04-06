import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import QuestionModel from '@/models/Question';
import AnswerModel from '@/models/Answer';
import mongoose from 'mongoose';
import { model, generationConfig, safetySettings } from '@/lib/gemini'; // Gemini設定をインポート

// 回答生成用のペルソナ定義
const answererPersonalities = [
    {
        name: "一般ランナーのゆうき",
        description: "市民ランナーとしての実体験に基づき、共感しやすく、実践的なアドバイスを心がける。専門用語はあまり使わない。"
    },
    {
        name: "論文解説が得意な研究者",
        description: "最新のスポーツ科学や生理学の論文データを引用し、客観的で詳細な情報を提供する。少し硬い表現になることもある。"
    },
    {
        name: "BACKAGINGトレーナー",
        description: "目標達成のための計画立案、メンタルサポート、連動性からアドバイスするBACKAGINGメソッドの専門家。"
    },
];

// 回答生成用のペルソナ選択関数
function getRandomAnswererPersonality() {
    return answererPersonalities[Math.floor(Math.random() * answererPersonalities.length)];
}

// POST: AIで複数の回答を生成
export async function POST(request: Request) {
    // ★★★ 管理者認証を実装する必要あり ★★★

    await dbConnect();

    try {
        const body = await request.json();
        const count = parseInt(body.count || '1', 10);

        if (count < 1 || count > 10) { // 同時生成数の上限 (例)
            return NextResponse.json({ message: 'Count must be between 1 and 10' }, { status: 400 });
        }

        // AIによる回答がまだない質問をランダムに取得
        // 注意: $lookup + $match や $where はパフォーマンスに影響する可能性あり。
        //       より効率的な方法として、Answer スキーマに isAIGenerated フラグを追加し、
        //       Question 側で AI 生成 Answer の ObjectId を持たないものを検索するなど。
        //       ここでは簡略化のため、answers 配列が空 or AI生成でない回答のみの質問を探す例。
        const targetQuestions = await QuestionModel.aggregate([
            // AI生成フラグ(isAIGenerated)がtrueの回答を除外する
            {
                $lookup: {
                    from: AnswerModel.collection.name,
                    let: { questionId: "$_id" },
                    pipeline: [
                        { $match: { 
                            $expr: { $eq: ["$question", "$$questionId"] },
                            isAIGenerated: true // AIが生成した回答を探す
                        } },
                        { $limit: 1 } // AI生成の回答が1つでもあれば十分
                    ],
                    as: "aiAnswers"
                }
            },
            {
                $match: {
                    aiAnswers: { $size: 0 } // AI生成の回答がない質問のみ抽出
                }
            },
            { $sample: { size: count } } // ランダムにcount件取得
        ]);

        if (!targetQuestions || targetQuestions.length === 0) {
            return NextResponse.json({ message: 'No unanswered questions found for AI generation.' }, { status: 404 });
        }

        let generatedCount = 0;
        const generatedAnswers = [];

        for (const question of targetQuestions) {
            try {
                const personality = getRandomAnswererPersonality();
                const prompt = `あなたは${personality.name} (${personality.description})です。以下の質問に対して、そのペルソナになりきって、具体的で役立つ、思慮深い回答を生成してください。回答は単一のテキストとして出力してください。\n            \n            質問タイトル: ${question.title}\n            質問内容: ${question.content}`;

                // Gemini API 呼び出し
                const chat = model.startChat({ generationConfig, safetySettings, history: [] });
                const result = await chat.sendMessage(prompt);
                const generatedAnswerText = result.response.text();

                if (!generatedAnswerText) {
                    console.warn(`AI did not generate an answer for Q: ${question._id}`);
                    continue; // この質問はスキップ
                }

                // DBに回答を保存
                const newAnswer = new AnswerModel({
                    content: generatedAnswerText.trim(),
                    question: question._id,
                    user: null, // AI生成
                    isAIGenerated: true,
                    aiPersonality: personality.name,
                });
                await newAnswer.save();
                generatedAnswers.push(newAnswer); // 詳細を返す場合

                // 質問に回答IDを追加 (重要: concurrent updateに注意が必要な場合あり)
                await QuestionModel.findByIdAndUpdate(question._id, { $push: { answers: newAnswer._id } });

                console.log(`Generated Answer for Q ${question._id}`);
                generatedCount++;

            } catch (singleError: any) {
                console.error(`Error generating answer for Q ${question._id}:`, singleError);
                // 個別エラーはログに残し、処理を続行
            }
        }

        return NextResponse.json({ message: `${generatedCount} answers generated successfully for ${targetQuestions.length} questions.`, generatedCount }, { status: 201 });

    } catch (error: any) {
        console.error('Error generating multiple answers:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
} 