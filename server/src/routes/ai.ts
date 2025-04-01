import express from 'express';
import { auth } from '../middleware/auth';
import { generateAnswer, evaluateAnswer, processWebhook } from '../controllers/ai';

const router = express.Router();

// AIのWebhook
router.post('/webhook', processWebhook as any);

// AIに回答を生成させる
router.post('/answers/generate/:questionId', auth as any, generateAnswer as any);

// AIの回答を評価する
router.post('/answers/evaluate/:answerId', auth as any, evaluateAnswer as any);

export default router; 