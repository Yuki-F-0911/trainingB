'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast'; // For displaying success/error messages

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Basic client-side validation
    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      toast.error('パスワードが一致しません。'); // Also show toast
      return;
    }
     if (password.length < 6) {
        setError('パスワードは6文字以上で入力してください。');
        toast.error('パスワードは6文字以上で入力してください。'); // Also show toast
        return;
     }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Use error message from API response if available
        throw new Error(data.message || `HTTP error! status: ${res.status}`);
      }

      // Registration successful
      toast.success(data.message || '登録が成功しました！ログインページに移動します。');
      // Redirect to login page after a short delay to allow user to see the toast
      setTimeout(() => {
         router.push('/login');
      }, 1500); // 1.5 second delay

    } catch (err: any) {
      console.error('Signup failed:', err);
      // Display error message from caught error or a generic one
      const errorMessage = err.message || '登録中にエラーが発生しました。';
      setError(errorMessage);
       toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">新規登録</h1>

        {/* Display error message inside the form */}
        {/* {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-center text-red-700">
            {error}
          </div>
        )} */} 

        <form onSubmit={handleSubmit} className="mb-6 space-y-4">
           <div>
             <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
               名前 (任意)
             </label>
             <input
               id="name"
               type="text"
               value={name}
               onChange={(e) => setName(e.target.value)}
               className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
               placeholder="山田 太郎"
               disabled={loading}
             />
           </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              パスワード (6文字以上) <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
              placeholder="********"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
              パスワード (確認用) <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
               minLength={6}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
              placeholder="********"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-md px-4 py-2 text-white transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${              loading
                ? 'cursor-not-allowed bg-blue-300'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>

        {/* Link to Login */}
        <p className="text-center text-sm text-gray-600">
          既にアカウントをお持ちですか？{' '}
          <Link href="/login" className="font-medium text-blue-500 hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
} 