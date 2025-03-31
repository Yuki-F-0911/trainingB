// Question インターフェース
export interface Question {
  id: string;
  _id?: string; // MongoDB から直接取得した場合に存在するプロパティ
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  isAIGenerated?: boolean;
  personality?: string;
  tags?: string[];
  author?: User;
  _count?: {
    answers: number;
  };
}

// Answer インターフェース
export interface Answer {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  questionId: string;
  isAIGenerated?: boolean;
  personality?: string;
  author?: User;
  ratings?: Rating[];
}

// User インターフェース
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
}

// Rating インターフェース
export interface Rating {
  id: string;
  value: number;
  userId: string;
  answerId: string;
  createdAt: string;
  updatedAt: string;
} 