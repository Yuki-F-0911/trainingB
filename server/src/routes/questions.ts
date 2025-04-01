import express from 'express';
import {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  voteQuestion,
} from '../controllers/questions';
import { auth, AuthRequest } from '../middleware/auth';
import answerRoutes from './answers';

const router = express.Router();

// 回答のルーターを質問IDをパラメータとして利用
router.use('/:questionId/answers', answerRoutes);

// 公開エンドポイント - 認証なしでアクセス可能
router.get('/', getQuestions as any);
router.get('/:id', getQuestion as any);

// 認証が必要なエンドポイント
router.post('/', auth as any, createQuestion as any);
router.put('/:id', auth as any, updateQuestion as any);
router.delete('/:id', auth as any, deleteQuestion as any);
router.post('/:id/vote', auth as any, voteQuestion as any);

export default router; 