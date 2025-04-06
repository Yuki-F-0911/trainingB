import dbConnect from '@/lib/dbConnect';
import QuestionModel, { IQuestion } from '@/models/Question';
import Link from 'next/link';
import { Suspense } from 'react';
import SearchResults from '@/components/search/SearchResult';
import SearchLoadingSkeleton from '@/components/search/SearchLoadingSkeleton';

export default async function SearchPage(props: { searchParams: { q?: string } }) {
  const query = props.searchParams?.q || '';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 border-b pb-2">
        検索結果: {query ? `"${query}"` : 'クエリが指定されていません'}
      </h1>

      <Suspense fallback={<SearchLoadingSkeleton />}>
        <SearchResults query={query} />
      </Suspense>
    </div>
  );
}

export async function generateMetadata(props: { searchParams: { q?: string } }) {
  const query = props.searchParams?.q || '';
  return {
    title: query ? `検索結果: ${query}` : '検索',
  };
}
