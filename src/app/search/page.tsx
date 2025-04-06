import { Suspense } from 'react';
import { Metadata } from 'next';
import SearchResults from '@/components/search/SearchResult';
import SearchLoadingSkeleton from '@/components/search/SearchLoadingSkeleton';

// 明示的に any 型を指定
export default async function SearchPage({ searchParams }: any) {
  // 型安全のため、明示的な変換を維持
  const query = typeof searchParams.q === 'string' ? searchParams.q : '';

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

// 明示的に any 型を指定
export async function generateMetadata({ searchParams }: any) {
  const query = typeof searchParams.q === 'string' ? searchParams.q : '';
  return {
    title: query ? `検索結果: ${query}` : '検索',
  };
}
