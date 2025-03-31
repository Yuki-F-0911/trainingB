import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateQuestions() {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `以下の形式で3つの質問を生成してください：
  {
    "questions": [
      {
        "title": "質問タイトル",
        "content": "質問内容"
      }
    ]
  }`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  try {
    const parsed = JSON.parse(text);
    return parsed.questions;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return [];
  }
} 