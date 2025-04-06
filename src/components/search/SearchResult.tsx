import dbConnect from '@/lib/dbConnect';
import QuestionModel, { IQuestion } from '@/models/Question';
import Link from 'next/link';
import UserModel from '@/models/User';

interface SearchResultsProps {
  query: string;
}

// 検索ロジックをコンポーネント内に実装
async function fetchSearchResults(query: string): Promise<IQuestion[]> {
  if (!query) return []; // クエリがなければ空を返す

  await dbConnect();
  
  // モデルを明示的に読み込み
  require('@/models/User');
  
  // 入力をスペースで分割してキーワード配列を作成
  const keywords = query.split(/\s+/).filter(k => k.length > 0);
  
  try {
    // キーワードがない場合は空の配列を返す
    if (keywords.length === 0) {
      return [];
    }

    // 各キーワードに対して$orクエリを作成
    const keywordConditions = keywords.map(keyword => {
      // 正規表現検索用にエスケープ
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return {
        $or: [
          { title: { $regex: escapedKeyword, $options: 'i' } },
          { content: { $regex: escapedKeyword, $options: 'i' } },
          // タグ検索も追加（タグがある場合）
          { tags: { $regex: escapedKeyword, $options: 'i' } }
        ]
      };
    });

    // すべてのキーワードに一致する質問を検索（AND検索）
    const questions = await QuestionModel.find({
      $and: keywordConditions,
    })
    // .populate('author', 'name') // 一時的にコメントアウト
    .sort({ createdAt: -1 })
    .lean(); // Use lean for performance and plain objects

    console.log(`検索結果数: ${questions.length}, キーワード: ${keywords.join(', ')}`);
    
    // lean() should handle Date serialization, but double-check if needed
    return JSON.parse(JSON.stringify(questions));

  } catch (error) {
    console.error('Error fetching search results:', error);
    // Consider throwing the error or returning a specific error state
    return [];
  }
}

// このコンポーネントはサーバーでレンダリングされ、データ取得を待ちます
export default async function SearchResults({ query }: SearchResultsProps) {
  const questions = await fetchSearchResults(query); // データ取得を待つ

  if (!query) {
     return <p>検索キーワードを入力してください。</p>;
  }

  if (questions.length === 0) {
    return <p>「{query}」に一致する質問は見つかりませんでした。</p>;
  }

  return (
    <ul className="space-y-4">
      {questions.map((question) => (
        // question._id は lean() を使っているので string になっているはず
        // ObjectId の場合は .toString() が必要
        <li key={question._id.toString()} className="border p-4 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200">
          <Link href={`/questions/${question._id.toString()}`} className="block mb-2">
            <h2 className="text-xl font-semibold text-blue-600 hover:underline">
              {question.title}
            </h2>
          </Link>
          {/* line-clamp は tailwindcss/line-clamp プラグインが必要な場合がある */}
          <p className="text-gray-700 mt-1 text-sm line-clamp-3">{question.content}</p>
           <div className="text-xs text-gray-500 mt-3 flex justify-between items-center">
             <span>
               投稿者: {typeof question.author === 'object' && question.author !== null && 'name' in question.author ? (question.author.name as string) : '不明'}
             </span>
             <span>
               {new Date(question.createdAt).toLocaleDateString()}
             </span>
           </div>
        </li>
      ))}
    </ul>
  );
}
