import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as ChatController from '../controllers/chat.controller';

const router = Router();

router.use(authenticate);
router.get('/friends', ChatController.listFriends);
router.get('/conversations', ChatController.listConversations);
router.get('/messages/:friendId', ChatController.listMessagesWithFriend);
router.post('/messages/:friendId', ChatController.sendMessageToFriend);

export default router;
