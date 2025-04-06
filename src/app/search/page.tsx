import dbConnect from '@/lib/dbConnect';
import QuestionModel, { IQuestion } from '@/models/Question';
import Link from 'next/link';
import { Suspense } from 'react';
import SearchResults from '@/components/search/SearchResult';
import SearchLoadingSkeleton from '@/components/search/SearchLoadingSkeleton';

interface SearchPageProps {
  searchParams: {
    q?: string;
  };
}

async function fetchSearchResults(query: string): Promise<IQuestion[]> {
  await dbConnect();

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  try {
    const questions = await QuestionModel.find({
      $or: [
        { title: { $regex: escapedQuery, $options: 'i' } },
        { content: { $regex: escapedQuery, $options: 'i' } },
      ],
    })
    .populate('author', 'name')
    .sort({ createdAt: -1 })
    .lean();

    return JSON.parse(JSON.stringify(questions));

  } catch (error) {
    console.error('Error fetching search results:', error);
    return [];
  }
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || '';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        検索結果: {query ? `"${query}"` : 'クエリが指定されていません'}
      </h1>

      <Suspense fallback={<SearchLoadingSkeleton />}>
        <SearchResults query={query} />
      </Suspense>
    </div>
  );
}

export async function generateMetadata({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || '';
  return {
    title: query ? `検索結果: ${query}` : '検索',
  };
}
