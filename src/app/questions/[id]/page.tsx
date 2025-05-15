import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getQuestion } from '@/lib/api/questions';
import QuestionDetail from '@//components/QuestionDetail';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const question = await getQuestion(params.id);
    if (!question) {
      return {
        title: '質問が見つかりません | トレーニング掲示板',
        robots: {
          index: false,
          follow: false
        }
      };
    }

    return {
      title: `${question.title} | トレーニング掲示板`,
      description: question.content.substring(0, 160),
      robots: {
        index: true,
        follow: true
      },
      openGraph: {
        title: question.title,
        description: question.content.substring(0, 160),
        type: 'article',
        locale: 'ja_JP',
        siteName: 'トレーニング掲示板'
      },
      twitter: {
        card: 'summary',
        title: question.title,
        description: question.content.substring(0, 160)
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'エラー | トレーニング掲示板',
      robots: {
        index: false,
        follow: false
      }
    };
  }
}

export default async function QuestionPage({ params }: Props) {
  try {
    const question = await getQuestion(params.id);
    
    if (!question) {
      notFound();
    }

    return (
      <ErrorBoundary
        fallback={
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">質問の読み込み中にエラーが発生しました</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              再読み込み
            </button>
          </div>
        }
      >
        <QuestionDetail question={question} />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error loading question:', error);
    throw error;
  }
} 