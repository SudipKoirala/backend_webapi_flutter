import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as NotificationController from '../controllers/notification.controller';

const router = Router();

router.use(authenticate);

router.get('/', NotificationController.getNotifications);
router.post('/read-all', NotificationController.markAllRead);
router.post('/restore', NotificationController.restoreNotifications);
router.patch('/:id/read', NotificationController.markRead);
router.patch('/:id/hide', NotificationController.hideNotification);

export default router;
