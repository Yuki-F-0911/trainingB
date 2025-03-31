import { Metadata } from 'next';
import AIGeneration from './AIGeneration';
import AutoAnswerGenerator from '../../components/admin/AutoAnswerGenerator';

export const metadata: Metadata = {
  title: 'AI質問生成 | 管理者ダッシュボード',
  description: 'AIによる質問生成を管理するページです',
};

export default function AIGenerationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">AI質問生成</h1>
      <p className="mb-6 text-gray-600">
        AIを使用して質問を自動生成します。生成された質問はシステムに保存され、ユーザーに表示されます。
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <AIGeneration />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">使用方法</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>「生成数」から一度に生成する質問の数を選択できます</li>
            <li>「質問を生成」ボタンをクリックすると、AIが質問を生成します</li>
            <li>生成された質問は自動的にデータベースに保存されます</li>
            <li>複数の質問を生成すると、バッチ処理で並列に生成されます</li>
            <li>生成タイプは「市民ランナー」「専門家」「BACKAGINGトレーナー」からランダムに選ばれます</li>
          </ul>
          <div className="mt-6 p-4 bg-yellow-50 rounded-md">
            <p className="text-yellow-700 text-sm">
              <strong>注意:</strong> AI生成の処理にはAPIリクエストが発生します。多数の質問を生成する場合は、APIの利用制限にご注意ください。
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-10">
        <h1 className="text-2xl font-bold mb-6">AI回答自動生成</h1>
        <p className="mb-6 text-gray-600">
          未回答の質問に対してAIが自動的に回答を生成します。
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <AutoAnswerGenerator />
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">回答生成について</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>まだ回答がついていない質問に対して優先的に回答を生成します</li>
              <li>回答は「市民ランナー」「専門家」「BACKAGINGトレーナー」のいずれかのパーソナリティから生成されます</li>
              <li>生成された回答は自動的にデータベースに保存され、質問詳細ページに表示されます</li>
              <li>この機能は定期的に実行することで、未回答の質問に対して自動的に回答を提供できます</li>
            </ul>
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <p className="text-blue-700 text-sm">
                <strong>ヒント:</strong> 質問詳細ページでユーザーから評価の高い回答がある場合は、自動生成された回答よりも上位に表示されます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 