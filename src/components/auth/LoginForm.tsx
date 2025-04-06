'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// This component contains the actual form logic and uses client-side hooks
export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); // This hook requires Suspense
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      switch (error) {
        case 'CredentialsSignin':
          setFormError('メールアドレスまたはパスワードが正しくありません。');
          break;
        case 'OAuthSignin':
        case 'OAuthCallbackError':
          setFormError('Googleログイン中にエラーが発生しました。時間を置いて再度お試しください。');
          break;
        default:
          try {
            const decodedError = decodeURIComponent(error);
            if (decodedError.length < 100 && !decodedError.toLowerCase().includes('error')) {
              setFormError(decodedError);
            } else {
              setFormError('ログイン中に予期せぬエラーが発生しました。');
            }
          } catch (e) {
            setFormError('ログイン中に不明なエラーが発生しました。');
          }
      }
      // Clear the error from the URL after displaying it
      // Use window.history.replaceState to avoid triggering navigation
      window.history.replaceState(null, '', '/login');
    }
  }, [error]); // Dependency array includes error

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (result?.error) {
      setFormError(result.error === 'CredentialsSignin' ? 'メールアドレスまたはパスワードが正しくありません。' : result.error || 'ログインに失敗しました。');
    } else if (result?.ok && !result.error) {
      router.push(callbackUrl);
      router.refresh();
    } else {
      setFormError("ログイン試行中に予期せぬ問題が発生しました。");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setFormError(null);
    await signIn('google', { callbackUrl: callbackUrl });
  };

  return (
    <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">ログイン</h1>

      {formError && (
        <div className="mb-4 rounded bg-red-100 p-3 text-center text-red-700">
          {formError}
        </div>
      )}

      <form onSubmit={handleCredentialsLogin} className="mb-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            メールアドレス
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
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
            placeholder="********"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-md px-4 py-2 text-white transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${            loading ? 'cursor-not-allowed bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>

      <div className="mb-6 flex items-center justify-center">
        <span className="h-px flex-grow bg-gray-300"></span>
        <span className="mx-4 text-sm text-gray-500">または</span>
        <span className="h-px flex-grow bg-gray-300"></span>
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className={`mb-6 flex w-full items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 ${          loading ? 'cursor-not-allowed opacity-50' : ''
        }`}
      >
        <svg className="mr-2 h-5 w-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
        Google でログイン
      </button>

      <p className="text-center text-sm text-gray-600">
        アカウントをお持ちでないですか？{' '}
        <Link href="/signup" className="font-medium text-blue-500 hover:underline">
          新規登録
        </Link>
      </p>
    </div>
  );
} 