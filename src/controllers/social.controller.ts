import { Request, Response } from 'express';
import * as SocialService from '../services/social.service';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/user.model';

export const searchUsers = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const q = (req.query.q as string) || '';
        const results = await SocialService.searchUsers(q, userId);
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Search failed' });
    }
};

export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const requesterId = (req as AuthRequest).user?.id;
        if (!requesterId) return res.status(401).json({ message: 'Unauthorized' });

        const { id } = req.params;
        const profile = await SocialService.getPublicProfile(id, requesterId);
        res.json(profile);
    } catch (error: any) {
        res.status(404).json({ message: error.message || 'User not found' });
    }
};

export const toggleFriend = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { id: friendId } = req.params;
        const result = await SocialService.toggleFriend(userId, friendId);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Failed to toggle friend' });
    }
};

export const listFriends = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const friends = await SocialService.listMyFriends(userId);
        res.json(friends);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to list friends' });
    }
};

export const toggleNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const result = await SocialService.toggleNotifications(userId);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Failed to toggle notifications' });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to get user' });
    }
};
