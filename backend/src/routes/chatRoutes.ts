import { Router } from 'express';
import { handleTextChat, handleImageChat } from '../controllers/chatController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.post('/text', requireAuth, handleTextChat);
router.post('/image', requireAuth, handleImageChat);

export default router;
