import { Router } from 'express';
import * as UserController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadImage } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.post('/notifications/toggle', UserController.toggleNotifications);
router.post('/friends/toggle/:friendId', UserController.toggleFriend);

export default router;
