import { Suspense } from 'react';
import { Metadata } from 'next';
import SearchResults from '@/components/search/SearchResult';
import SearchLoadingSkeleton from '@/components/search/SearchLoadingSkeleton';

// 標準 Next.js の型を使用
type Props = {
  params: {};
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function SearchPage({ searchParams }: Props) {
  // searchParams から query を取得
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

// メタデータ生成関数も同じ Props 型を使用
export function generateMetadata({ searchParams }: Props): Metadata {
  const query = typeof searchParams.q === 'string' ? searchParams.q : '';
  return {
    title: query ? `検索結果: ${query}` : '検索',
  };
}
