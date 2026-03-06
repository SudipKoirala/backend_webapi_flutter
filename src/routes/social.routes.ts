import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as SocialController from '../controllers/social.controller';

const router = Router();

router.use(authenticate);

router.get('/search', SocialController.searchUsers);
router.get('/me', SocialController.getMe);
router.get('/users/:id', SocialController.getUserProfile);
router.post('/friends/:id', SocialController.toggleFriend);
router.get('/friends', SocialController.listFriends);
router.post('/notifications/toggle', SocialController.toggleNotifications);

export default router;
