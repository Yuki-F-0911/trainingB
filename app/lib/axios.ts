import axios from 'axios';

// 公式APIサーバーのURLを固定で使用
const API_URL = 'https://training-board-server.vercel.app/api';

console.log('API URL設定:', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient; 