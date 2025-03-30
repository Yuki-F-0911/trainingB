import axios from 'axios';

// サーバーサイドでの実行時はプロセス環境変数を直接使用
// クライアントサイドでの実行時はNEXT_PUBLIC_*変数を使用
const API_URL = 
  typeof window === 'undefined' 
    ? process.env.API_URL || 'http://localhost:5000/api'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

console.log('API URL設定:', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient; 