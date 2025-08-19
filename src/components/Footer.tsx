import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="text-gray-800 hover:text-gray-600">
              © 2024 トレーニング掲示板
            </Link>
          </div>
          <nav className="flex space-x-6">
            <Link
              href="/privacy"
              className="text-gray-600 hover:text-gray-900"
            >
              プライバシーポリシー
            </Link>
            <Link
              href="/terms"
              className="text-gray-600 hover:text-gray-900"
            >
              利用規約
            </Link>
            <Link
              href="/contact"
              className="text-gray-600 hover:text-gray-900"
            >
              お問い合わせ
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
} 