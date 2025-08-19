import { Suspense } from 'react';
import { Metadata } from 'next';
import SearchResults from '@/components/search/SearchResult';
import SearchLoadingSkeleton from '@/components/search/SearchLoadingSkeleton';

// 明示的に any 型を指定
export default async function SearchPage({ searchParams }: any) {
  // 型安全のため、明示的な変換を維持
  const query = typeof searchParams.q === 'string' ? searchParams.q : '';

  return (
    <>
      {/* 構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SearchResultsPage",
            "name": query ? `検索結果: ${query}` : "検索ページ",
            "description": query ? `"${query}"に関する検索結果` : "トレーニング掲示板の検索ページ",
            "url": `https://www.training-board-test.com/search?q=${encodeURIComponent(query)}`,
            "mainEntity": {
              "@type": "ItemList",
              "name": "検索結果"
            }
          })
        }}
      />
      
      <div>
        <h1 className="text-2xl font-bold mb-6 border-b pb-2">
          検索結果: {query ? `"${query}"` : 'クエリが指定されていません'}
        </h1>

        <Suspense fallback={<SearchLoadingSkeleton />}>
          <SearchResults query={query} />
        </Suspense>
      </div>
    </>
  );
}

// 明示的に any 型を指定
export async function generateMetadata({ searchParams }: any): Promise<Metadata> {
  const query = typeof searchParams.q === 'string' ? searchParams.q : '';
  
  return {
    title: query ? `検索結果: ${query} | トレーニング掲示板` : '検索 | トレーニング掲示板',
    description: query ? `"${query}"に関する検索結果です。ランニングやマラソンに関する質問と回答を検索できます。` : 'トレーニング掲示板で質問を検索できます。',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      }
    },
    openGraph: {
      title: query ? `検索結果: ${query} | トレーニング掲示板` : '検索 | トレーニング掲示板',
      description: query ? `"${query}"に関する検索結果です。` : 'トレーニング掲示板で質問を検索できます。',
      type: "website",
      locale: "ja_JP",
      siteName: "トレーニング掲示板",
      url: `https://www.training-board-test.com/search?q=${encodeURIComponent(query)}`,
    },
    twitter: {
      card: "summary_large_image",
      title: query ? `検索結果: ${query} | トレーニング掲示板` : '検索 | トレーニング掲示板',
      description: query ? `"${query}"に関する検索結果です。` : 'トレーニング掲示板で質問を検索できます。',
    },
  };
}
