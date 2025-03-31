'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import axios from '@/app/lib/axios';
import AnswerForm from '@/app/components/answers/AnswerForm';
import AnswerList from '@/app/components/answers/AnswerList';

interface QuestionDetailProps {
  questionId: string;
}

const QuestionDetail = ({ questionId }: QuestionDetailProps) => {
  const { data: session } = useSession();
  const [question, setQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRating, setUserRating] = useState<number | null>(null);

  useEffect(() => {
    const fetchQuestionDetail = async () => {
      try {
        setLoading(true);
        setError('');
        
        // axios を使ってデータを取得する
        const response = await axios.get(`/questions/${questionId}`);
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
        setError(err.message || err.response?.data?.error || '質問の取得中にエラーが発生しました');
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
      const updatedResponse = await axios.get(`/questions/${questionId}`);
      
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

  const addNewAnswer = (answer: any) => {
    setAnswers([...answers, answer]);
  };

  if (loading) {
    return <div className="text-center py-12">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
        エラー: {error}
      </div>
    );
  }

  if (!question) {
    return <div className="text-center py-12">質問が見つかりません</div>;
  }

  const createdAt = new Date(question.createdAt);
  const timeAgo = formatDistanceToNow(createdAt, { locale: ja, addSuffix: true });

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{question.title}</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {question.answersCount || question._count?.answers || answers.length} 回答
            </span>
            <span className="text-sm text-gray-600">
              {question.views || 0} 閲覧
            </span>
          </div>
        </div>

        <div className="prose max-w-none mb-6">
          <p className="text-gray-800 whitespace-pre-wrap">{question.content}</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {question.tags && question.tags.map((tag: string, index: number) => (
            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>投稿者: {question.user?.name || question.author?.name || '不明'}</span>
            {question.isAIGenerated && (
              <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                AI生成
              </span>
            )}
          </div>
          <span>{timeAgo}</span>
        </div>
        
        {/* 評価ボタン */}
        {session && (
          <div className="mt-6 flex items-center space-x-2">
            <button 
              onClick={() => handleRating(1)}
              className={`px-3 py-1 rounded-md ${userRating === 1 ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            >
              役立つ 👍
            </button>
            <button 
              onClick={() => handleRating(-1)}
              className={`px-3 py-1 rounded-md ${userRating === -1 ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
            >
              役立たない 👎
            </button>
          </div>
        )}
      </div>

      {/* 回答セクション */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {answers.length}件の回答
        </h2>
        
        <AnswerList 
          answers={answers} 
          questionId={questionId}
          onAnswerUpdate={(updatedAnswer) => {
            setAnswers(answers.map(ans => 
              ans.id === updatedAnswer.id ? updatedAnswer : ans
            ));
          }}
          onAnswerDelete={(deletedId) => {
            setAnswers(answers.filter(ans => ans.id !== deletedId));
          }}
        />
        
        {session ? (
          <AnswerForm 
            questionId={questionId} 
            onAnswerSubmit={addNewAnswer}
          />
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600">
              回答を投稿するには
              <Link href="/auth/signin" className="text-blue-600 hover:underline ml-1">
                ログイン
              </Link>
              してください
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetail; 