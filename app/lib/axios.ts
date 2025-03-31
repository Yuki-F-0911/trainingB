import axios from 'axios';

// 環境変数からAPIのベースURLを取得
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

console.log('API_URL:', API_URL);

// axiosのインスタンスを作成
const instance = axios.create({
  baseURL: API_URL,
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