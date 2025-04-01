import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

// カスタムリクエスト型の拡張
export interface AuthRequest extends Request {
  user?: any;
}

// 認証ミドルウェア
export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: '認証トークンがありません' });
    }
    
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'default_secret_key'
    ) as { user: { id: string } };
    
    req.user = decoded.user;
    next();
  } catch (error) {
    console.error('認証エラー:', error);
    return res.status(401).json({ message: '認証に失敗しました' });
  }
};

export const generateToken = (id: string) => {
  // 新しいフォーマットでトークンを生成
  const payload = {
    user: {
      id
    }
  };
  
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'defaultsecret', {
    expiresIn: '30d',
  });
  
  console.log(`トークン生成: ユーザーID=${id}, トークン=${token.substring(0, 15)}...`);
  return token;
}; 