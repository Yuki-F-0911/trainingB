import { Request, Response } from 'express';
import { getGeminiModel } from '../config/gemini';
import { Question } from '../models/Question';
import { Answer } from '../models/Answer';
import { User } from '../models/User';

interface AuthRequest extends Request {
  user?: any;
}

// @desc    AIによるWebhook処理
// @route   POST /api/ai/webhook
// @access  Public (with secret)
export const processWebhook = async (req: Request, res: Response) => {
  try {
    const { secret } = req.body;
    
    // Webhookのシークレットキーを検証
    if (secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: '無効なシークレットキーです' });
    }

    const model = getGeminiModel();
    const personalities = [
      {
        name: '市民ランナー',
        prompt: 'あなたは一般の市民ランナーです。マラソンやランニングに関する質問に、一般ランナーの視点から回答してください。',
      },
      {
        name: '専門家',
        prompt: 'あなたはランニングの専門家です。科学的な根拠に基づいて、マラソンやランニングに関する質問に回答してください。',
      },
      {
        name: 'BACKAGINGトレーナー',
        prompt: 'あなたはBACKAGINGジムのトレーナーです。実践的なアドバイスと、ジムでのトレーニング経験に基づいて回答してください。',
      },
    ];
    const personality = personalities[Math.floor(Math.random() * personalities.length)];

    // AIユーザーを取得または作成
    const aiUser = await User.findOneAndUpdate(
      { email: 'ai@training-board.com' },
      {
        username: 'AI Assistant',
        email: 'ai@training-board.com',
        password: require('crypto').randomBytes(32).toString('hex'),
      },
      { upsert: true, new: true }
    );

    // 質問を生成
    const questionPrompt = `${personality.prompt}
以下のような質問を生成してください：
- マラソンやランニングに関する質問
- 具体的で実践的な内容
- 一般のランナーが抱える疑問や悩み
- タイトルと本文を分けて出力

出力形式：
タイトル：[タイトル]
本文：[本文]`;

    const questionResponse = await model.generateContent(questionPrompt);
    const questionText = (await questionResponse.response).text();

    const titleMatch = questionText.match(/タイトル：(.+)/);
    const contentMatch = questionText.match(/本文：(.+)/s);
    
    if (!titleMatch || !contentMatch) {
      throw new Error('AIの応答形式が不正です');
    }

    // 質問をデータベースに保存
    const question = await Question.create({
      title: titleMatch[1].trim(),
      content: contentMatch[1].trim(),
      author: aiUser._id,
      isAIGenerated: true,
      tags: ['AI生成', personality.name]
    });

    // 回答を生成
    const answerPrompt = `${personality.prompt}
以下の質問に対して、専門的な視点から回答を生成してください：

質問タイトル：${question.title}
質問内容：${question.content}

回答は具体的で実用的な内容にしてください。`;

    const answerResponse = await model.generateContent(answerPrompt);
    const answerText = (await answerResponse.response).text();

    // 回答をデータベースに保存
    const answer = await Answer.create({
      content: answerText.trim(),
      author: aiUser._id,
      question: question._id,
      isAIGenerated: true
    });

    res.json({ 
      message: 'AIの質問と回答の生成が完了しました',
      questionId: question._id,
      answerId: answer._id
    });
  } catch (error: any) {
    console.error('Webhookエラー:', error);
    res.status(500).json({ error: error.message || 'エラーが発生しました' });
  }
};

// @desc    AIによる質問生成
// @route   POST /api/ai/generate-question
// @access  Private
export const generateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { topic } = req.body;
    const model = getGeminiModel();

    const prompt = `
マラソントレーニングに関する質問を生成してください。
以下の形式で出力してください：
{
  "title": "質問のタイトル（50-100文字）",
  "content": "質問の詳細な内容（200-500文字）",
  "tags": ["関連するタグを3-5個"]
}

トピック: ${topic}
質問は具体的で実践的な内容にしてください。
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const questionData = JSON.parse(text);
      
      // 質問を保存
      const question = await Question.create({
        ...questionData,
        author: req.user._id,
        isAIGenerated: true,
      });

      res.status(201).json(question);
    } catch (error) {
      res.status(400).json({ message: 'AIの出力を解析できませんでした' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    AIによる回答生成
// @route   POST /api/ai/generate-answer/:questionId
// @access  Private
export const generateAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const questionId = req.params.questionId;
    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ message: '質問が見つかりません' });
    }

    const model = getGeminiModel();

    const prompt = `
以下の質問に対する回答を生成してください：

タイトル: ${question.title}
内容: ${question.content}
タグ: ${question.tags.join(', ')}

回答は以下の要件を満たすようにしてください：
- 具体的で実践的なアドバイスを含める
- 科学的な根拠がある場合は言及する
- 安全面への配慮を含める
- 500文字程度で簡潔にまとめる

回答は以下の形式で出力してください：
{
  "content": "回答の内容"
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const answerData = JSON.parse(text);

      // 回答を保存
      const answer = await Answer.create({
        content: answerData.content,
        author: req.user._id,
        question: questionId,
        isAIGenerated: true,
      });

      res.status(201).json(answer);
    } catch (error) {
      res.status(400).json({ message: 'AIの出力を解析できませんでした' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    AIによる回答の評価
// @route   POST /api/ai/evaluate-answer/:answerId
// @access  Private
export const evaluateAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const answerId = req.params.answerId;
    const answer = await Answer.findById(answerId).populate('question');

    if (!answer) {
      return res.status(404).json({ message: '回答が見つかりません' });
    }

    const model = getGeminiModel();

    const prompt = `
以下の質問と回答のペアを評価してください：

質問:
タイトル: ${(answer.question as any).title}
内容: ${(answer.question as any).content}

回答:
${answer.content}

以下の観点で評価し、JSON形式で出力してください：
{
  "score": 1-10の評価点数,
  "strengths": ["良い点を3つ程度"],
  "weaknesses": ["改善点を3つ程度"],
  "suggestion": "改善のためのアドバイス"
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const evaluation = JSON.parse(text);
      res.json(evaluation);
    } catch (error) {
      res.status(400).json({ message: 'AIの出力を解析できませんでした' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 