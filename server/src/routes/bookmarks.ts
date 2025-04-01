import express from 'express';
import { auth } from '../middleware/auth';
import { 
  getBookmarks, 
  createBookmark, 
  deleteBookmark 
} from '../controllers/bookmarks';

const router = express.Router();

// すべてのルートに認証ミドルウェアを適用
router.use(auth as any);

// ブックマークのルート
router.get('/', getBookmarks as any);
router.post('/', createBookmark as any);
router.delete('/:questionId', deleteBookmark as any);

export default router; 