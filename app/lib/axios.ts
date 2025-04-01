import axios from 'axios';

// 環境変数からAPIのベースURLを取得
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// API_URLが設定されていない場合は、現在のホストを使用
const baseURL = API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

// apiパスの重複を防ぐための処理
const cleanBaseURL = baseURL.endsWith('/api') ? baseURL : `${baseURL}`;

console.log('API_URL:', cleanBaseURL);

// axiosのインスタンスを作成
const instance = axios.create({
  baseURL: cleanBaseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエスト時のインターセプター
instance.interceptors.request.use(
  (config) => {
    console.log(`Axios Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Axios Request Error:', error);
    return Promise.reject(error);
  }
);

// レスポンス時のインターセプター
instance.interceptors.response.use(
  (response) => {
    console.log(`Axios Response [${response.status}]:`, response.config.url);
    return response;
  },
  (error) => {
    console.error('Axios Response Error:', error.response || error);
    return Promise.reject(error);
  }
);

export default instance; 