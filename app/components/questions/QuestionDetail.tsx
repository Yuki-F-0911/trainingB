'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnswerForm from '@/app/components/answers/AnswerForm';
import AnswerList from '@/app/components/answers/AnswerList';

interface Answer {
  id: string;
  content: string;
  createdAt: string;
  author?: {
    name?: string;
  };
  isAIGenerated?: boolean;
  personality?: string;
}

interface Question {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author?: {
    name?: string;
  };
  answers?: Answer[];
  tags?: string[];
  personality?: string;
  isAIGenerated?: boolean;
}

interface QuestionDetailProps {
  questionId: string;
}

const QuestionDetail = ({ questionId }: QuestionDetailProps) => {
  const { data: session } = useSession();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchQuestionDetail = async () => {
      try {
        // questionIdが空か無効な場合のチェック
        if (!questionId || questionId === 'undefined') {
          console.error('無効な質問ID:', questionId);
          setError('無効な質問IDです。有効な質問IDを指定してください。');
          setLoading(false);
          return;
        }
        
        setLoading(true);
        setError(null);
        
        // サーバーAPIに直接アクセスするよう修正
        console.log(`質問詳細を取得: ${questionId}`);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://training-board-server.vercel.app/api'}/questions/${questionId}`);
        console.log('質問詳細データ:', response.data);
        
        // APIレスポンスの形式に応じてデータを抽出
        if (response.data && response.data.question) {
          setQuestion(response.data.question);
          setAnswers(response.data.answers || []);
        } else if (response.data) {
          // 直接質問オブジェクトが返される場合
          setQuestion(response.data);
          setAnswers(response.data.answers || []);
        } else {
          throw new Error('予期しない応答形式です');
        }
      } catch (err: any) {
        console.error('質問詳細取得エラー:', err);
        setError('質問の取得に失敗しました：' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    
    if (questionId) {
      fetchQuestionDetail();
    }
  }, [questionId]);

  const handleRating = async (value: number) => {
    if (!session) {
      alert('評価するにはログインが必要です');
      return;
    }
    
    try {
      const response = await axios.post('/ratings', {
        type: 'question',
        targetId: questionId,
        value: value,
      });
      
      // 成功したら質問を再取得
      const updatedResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://training-board-server.vercel.app/api'}/questions/${questionId}`);
      
      if (updatedResponse.data && updatedResponse.data.question) {
        setQuestion(updatedResponse.data.question);
      } else {
        setQuestion(updatedResponse.data);
      }
      
      // ユーザーの評価状態を更新
      setUserRating(value === userRating ? null : value);
    } catch (err: any) {
      console.error('評価エラー:', err);
      alert(err.response?.data?.error || err.message || '評価の送信中にエラーが発生しました');
    }
  };

  const addNewAnswer = (answer: Answer) => {
    setAnswers([...answers, answer]);
  };

  const handleAnswerSubmit = (newAnswer: Answer) => {
    if (question && question.answers) {
      // 既存の回答リストに新しい回答を追加
      setQuestion({
        ...question,
        answers: [...question.answers, newAnswer]
      });
    }
  };

  const handleAnswerUpdate = (updatedAnswer: Answer) => {
    if (question && question.answers) {
      // 更新された回答で回答リストを更新
      const updatedAnswers = question.answers.map(answer => 
        answer.id === updatedAnswer.id ? updatedAnswer : answer
      );
      setQuestion({ ...question, answers: updatedAnswers });
    }
  };

  const handleAnswerDelete = (answerId: string) => {
    if (question && question.answers) {
      // 削除された回答を回答リストから除外
      const filteredAnswers = question.answers.filter(answer => answer.id !== answerId);
      setQuestion({ ...question, answers: filteredAnswers });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
          onClick={() => router.push('/questions')}
        >
          質問一覧に戻る
        </button>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center p-8">
        <p className="text-gray-600 mb-4">質問が見つかりませんでした。</p>
        <button 
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
          onClick={() => router.push('/questions')}
        >
          質問一覧に戻る
        </button>
      </div>
    );
  }

  const createdAt = new Date(question.createdAt);
  const timeAgo = formatDistanceToNow(createdAt, { locale: ja, addSuffix: true });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">{question.title}</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          {question.tags && question.tags.map((tag) => (
            <span key={tag} className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-sm">
              {tag}
            </span>
          ))}
          {question.isAIGenerated && (
            <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-sm">
              AI生成
            </span>
          )}
          {question.personality && (
            <span className="bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full text-sm">
              {question.personality}
            </span>
          )}
        </div>
        <div className="prose max-w-none mb-4">
          <p className="whitespace-pre-wrap">{question.content}</p>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>投稿者: {question.author?.name || '不明'}</span>
          <span>{timeAgo}</span>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">回答</h2>
        <AnswerList 
          answers={question.answers || []} 
          questionId={questionId}
          onAnswerUpdate={handleAnswerUpdate}
          onAnswerDelete={handleAnswerDelete}
        />
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">あなたの回答</h3>
        <AnswerForm questionId={questionId} onAnswerSubmit={handleAnswerSubmit} />
      </div>
    </div>
  );
};

export default QuestionDetail; 