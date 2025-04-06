import dbConnect from '@/lib/dbConnect';
import QuestionModel, { IQuestion } from '@/models/Question';
import Link from 'next/link';

interface SearchResultsProps {
  query: string;
}

// 検索ロジックをコンポーネント内に実装
async function fetchSearchResults(query: string): Promise<IQuestion[]> {
  if (!query) return []; // クエリがなければ空を返す

  await dbConnect();
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  try {
    const questions = await QuestionModel.find({
      $or: [
        { title: { $regex: escapedQuery, $options: 'i' } },
        { content: { $regex: escapedQuery, $options: 'i' } },
      ],
    })
    .populate('author', 'name') // Populate author name
    .sort({ createdAt: -1 })
    .lean(); // Use lean for performance and plain objects

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
