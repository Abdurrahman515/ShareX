import express from 'express';
import protectRoute from '../middlewares/protectRoute.js';
import { getConversations, getMessages, getUnSeenMessages, saveConversation, sendMessage } from '../controllers/messageController.js';

const router = express.Router();

router.post('/:otherUserId/save', protectRoute, saveConversation);
router.get('/unseenmessages', protectRoute, getUnSeenMessages);
router.get('/conversations', protectRoute, getConversations);
router.get('/:otherUserId', protectRoute, getMessages);
router.post('/send', protectRoute, sendMessage);

export default router;