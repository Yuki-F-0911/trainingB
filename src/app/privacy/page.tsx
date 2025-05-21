import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "プライバシーポリシー | トレーニング掲示板",
  description: "トレーニング掲示板のプライバシーポリシーです。当サイトでの個人情報の取り扱いについて説明しています。",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>
      
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. 個人情報の収集について</h2>
          <p className="mb-4">
            当サイトでは、以下の目的で個人情報を収集します：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>ユーザーアカウントの作成と管理</li>
            <li>質問・回答の投稿と管理</li>
            <li>通知の送信</li>
            <li>サイトの利用状況の分析と改善</li>
          </ul>
          <p>
            収集する情報には、メールアドレス、名前、パスワード（暗号化された状態）が含まれます。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Google Analyticsの利用について</h2>
          <p className="mb-4">
            当サイトでは、サービスの改善とユーザー体験の向上のためにGoogle Analyticsを使用しています。
            Google Analyticsは、Cookieを使用して以下の情報を収集します：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>アクセスしたページ</li>
            <li>滞在時間</li>
            <li>参照元</li>
            <li>デバイス情報</li>
            <li>ブラウザ情報</li>
          </ul>
          <p>
            これらの情報は匿名で収集され、個人を特定できる情報は含まれません。
            Google Analyticsの利用規約については、
            <a href="https://marketingplatform.google.com/about/analytics/terms/jp/" 
               className="text-blue-600 hover:underline" 
               target="_blank" 
               rel="noopener noreferrer">
              Google Analytics利用規約
            </a>
            をご覧ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. 個人情報の利用目的</h2>
          <p className="mb-4">
            収集した個人情報は、以下の目的で利用します：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>ユーザー認証とアカウント管理</li>
            <li>質問・回答の投稿と管理</li>
            <li>通知の送信</li>
            <li>サービスの改善と新機能の開発</li>
            <li>不正利用の防止</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. 個人情報の管理</h2>
          <p className="mb-4">
            当サイトでは、個人情報の適切な管理のために以下の対策を実施しています：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>個人情報へのアクセス制限</li>
            <li>データの暗号化</li>
            <li>セキュリティ対策の実施</li>
            <li>従業員への教育と監督</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. 個人情報の開示・共有</h2>
          <p className="mb-4">
            当サイトは、以下の場合を除き、個人情報を第三者に開示・共有することはありません：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>ユーザーの同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>ユーザーまたは第三者の権利・財産を保護するために必要な場合</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Cookieの使用</h2>
          <p className="mb-4">
            当サイトでは、以下の目的でCookieを使用しています：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>ユーザー認証の維持</li>
            <li>サイトの利用状況の分析</li>
            <li>ユーザー体験の向上</li>
          </ul>
          <p>
            ブラウザの設定により、Cookieの使用を制限することができます。
            ただし、その場合、一部の機能が正常に動作しない可能性があります。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. プライバシーポリシーの変更</h2>
          <p>
            当サイトは、必要に応じて本プライバシーポリシーを変更することがあります。
            重要な変更がある場合は、サイト上で通知します。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. お問い合わせ</h2>
          <p>
            プライバシーポリシーに関するお問い合わせは、
            サイト内の問い合わせフォームまたは管理者アカウントまでご連絡ください。
          </p>
        </section>

        <p className="text-sm text-gray-600 mt-8">
          最終更新日: 2024年3月
        </p>
      </div>
    </div>
  );
} 