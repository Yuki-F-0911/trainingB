import QuestionModel from '@/models/Question';
import { IQuestion } from '@/models/Question';

export async function getQuestion(id: string): Promise<IQuestion | null> {
  try {
    const question = await QuestionModel.findById(id).lean();
    return question;
  } catch (error) {
    console.error('Error fetching question:', error);
    return null;
  }
} 