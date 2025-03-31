import { Metadata } from 'next';
import { QuestionDetail } from '@/app/components/questions/QuestionDetail';

interface Props {
  params: {
    id: string;
  };
}

// メタデータを動的に生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // idが無効な場合はデフォルトのメタデータを返す
    const questionId = params.id;
    if (!questionId || questionId === 'undefined') {
      console.error('generateMetadata: 無効な質問ID', questionId);
      return {
        title: '質問詳細',
        description: '質問の詳細ページです',
      };
    }

    // デバッグログの追加
    console.log('質問メタデータ生成のID:', questionId);
    
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://training-board-server.vercel.app/api'}/questions/${questionId}`;
    console.log('APIリクエストURL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const question = data.question || data;
    
    return {
      title: question?.title || '質問詳細',
      description: question?.content?.substring(0, 160) || '質問の詳細ページです',
    };
  } catch (error) {
    console.error('メタデータ生成エラー:', error);
    return {
      title: '質問詳細',
      description: '質問の詳細ページです',
    };
  }
}

// クライアントサイドの処理をClientComponentに移動
import QuestionPageClient from './QuestionPageClient';

export default function QuestionPage({ params }: Props) {
  // IDを明示的に文字列として扱う
  const questionId = String(params.id);
  
  // クライアントコンポーネントにIDを渡す
  return <QuestionPageClient questionId={questionId} />;
} 