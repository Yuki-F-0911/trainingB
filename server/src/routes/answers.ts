import express from 'express';
import {
  getAnswers,
  getAnswerById,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  voteAnswer,
} from '../controllers/answers';
import { auth } from '../middleware/auth';

const router = express.Router({ mergeParams: true });

// 回答を取得
router.get('/', getAnswers as any);
router.get('/:id', getAnswerById as any);

// 回答を作成
router.post('/', auth as any, createAnswer as any);

// 回答を更新
router.put('/:id', auth as any, updateAnswer as any);

// 回答を削除
router.delete('/:id', auth as any, deleteAnswer as any);

// 回答の投票
router.post('/:id/vote', auth as any, voteAnswer as any);

export default router; 