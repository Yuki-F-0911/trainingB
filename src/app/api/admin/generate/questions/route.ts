import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import dbConnect from '@/lib/dbConnect';
import QuestionModel from '@/models/Question';
import { model, generationConfig, safetySettings } from '@/lib/gemini'; // Gemini設定をインポート

// 質問生成用のペルソナ定義
function getRandomQuestionerPersonality() {
    const questionerPersonalities = [
        { name: "初心者ランナーのエミリー", description: "最近ランニングを始めたばかり。基本的なことから知りたい。" },
        { name: "経験豊富なコーチの健太", description: "長年の指導経験を持つ。科学的根拠に基づいたアドバイスが得意。" },
        { name: "データ分析好きの理系ランナー", description: "GPSウォッチのデータを分析するのが好き。効率的なトレーニングを追求。" },
        { name: "楽しく走りたいエンジョイ派のマキ", description: "タイムよりも、景色や仲間とのランを楽しむ。モチベーション維持のコツを知りたい。" },
        { name: "ウルトラマラソン完走者のタフガイ", description: "100km以上のレースも経験済み。長距離対策や精神力について語る。" },
    ];
    return questionerPersonalities[Math.floor(Math.random() * questionerPersonalities.length)];
}

// POST: AIで質問を生成
export async function POST(request: Request) {
    // ★★★ 管理者認証を実装する必要あり ★★★

    try {
        await dbConnect();
        const body = await request.json();
        const count = parseInt(body.count || '1', 10);

        if (count < 1 || count > 10) { // 上限設定 (例)
            return NextResponse.json({ message: 'Count must be between 1 and 10' }, { status: 400 });
        }

        const generatedQuestions = [];
        for (let i = 0; i < count; i++) {
            const personality = getRandomQuestionerPersonality();
            const prompt = `あなたは${personality.name} (${personality.description})です。マラソンやランニングに関する、具体的で興味深い質問を1つだけ生成してください。質問はタイトルと内容に分け、以下のJSON形式で出力してください:\n                {\n                  "title": "ここに質問タイトル",\n                  "content": "ここに質問内容"\n                }`;

            // Gemini API 呼び出し
            const chat = model.startChat({ generationConfig, safetySettings, history: [] });
            const result = await chat.sendMessage(prompt);
            const responseText = result.response.text();

            // JSON パース試行
            let parsedResponse;
            try {
                const jsonMatch = responseText.match(/```json\n({.*})\n```/s);
                if (jsonMatch && jsonMatch[1]) {
                    parsedResponse = JSON.parse(jsonMatch[1]);
                } else {
                    // 念のため、直接のJSONも試す
                    try {
                        parsedResponse = JSON.parse(responseText);
                    } catch {
                         throw new Error('Response is not valid JSON or markdown JSON');
                    }
                }
                
                if (!parsedResponse.title || !parsedResponse.content) {
                    throw new Error('Invalid format from AI: title or content missing');
                }
            } catch (parseError: any) {
                console.error("AI response parsing error:", parseError, "\nRaw response:", responseText);
                continue; // エラーが発生した質問はスキップ
            }

            // DBに保存
            const newQuestion = new QuestionModel({
                title: parsedResponse.title,
                content: parsedResponse.content,
                author: null, // AI生成なので null
                isAIGenerated: true,
                aiPersonality: personality.name,
                __skipValidation: true
            });
            await newQuestion.save();
            generatedQuestions.push(newQuestion);
            console.log(`Generated Question ${i + 1}: ${newQuestion.title}`);
        }

        if (generatedQuestions.length === 0 && count > 0) {
            return NextResponse.json({ message: 'AI failed to generate any valid questions.' }, { status: 500 });
        }

        return NextResponse.json({ message: `${generatedQuestions.length} questions generated`, questions: generatedQuestions }, { status: 201 });

    } catch (error: any) {
        console.error('Error generating questions:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
} 