import express, { Response } from 'express';
import { registerUser, loginUser, getCurrentUser } from '../controllers/auth';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    ユーザー登録
// @access  Public
router.post('/register', registerUser as any);

// @route   POST /api/auth/login
// @desc    ユーザーログイン、トークン取得
// @access  Public
router.post('/login', loginUser as any);

// @route   GET /api/auth/me
// @desc    現在のユーザー情報を取得
// @access  Private
router.get('/me', auth as any, (async (req: AuthRequest, res: Response) => { 
  await getCurrentUser(req, res);
}) as any);

export default router; 