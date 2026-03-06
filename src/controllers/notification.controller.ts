import { Request, Response } from 'express';
import * as NotificationService from '../services/notification.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const notifications = await NotificationService.getNotifications(userId);
        res.json(notifications);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to get notifications' });
    }
};

export const markRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const { id } = req.params;
        const n = await NotificationService.markRead(id, userId);
        res.json(n);
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Failed to mark as read' });
    }
};

export const markAllRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const result = await NotificationService.markAllRead(userId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to mark all as read' });
    }
};

export const hideNotification = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const { id } = req.params;
        const n = await NotificationService.hideNotification(id, userId);
        res.json(n);
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Failed to hide notification' });
    }
};

export const restoreNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const result = await NotificationService.restoreHiddenNotifications(userId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to restore notifications' });
    }
};
