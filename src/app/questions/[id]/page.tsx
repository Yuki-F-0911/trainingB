import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getQuestion } from '@/lib/api/questions';
import QuestionDetail from '@/components/QuestionDetail';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ErrorFallback from '@/components/ErrorFallback';

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
      <ErrorBoundary fallback={<ErrorFallback />}>
        <QuestionDetail question={question} />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error loading question:', error);
    throw error;
  }
} 