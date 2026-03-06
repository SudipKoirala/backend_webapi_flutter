import { Request, Response } from 'express';
import * as StoryService from '../services/story.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const createStory = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        if (!req.file) return res.status(400).json({ message: 'Media file is required' });

        const mediaUrl = `/uploads/${req.file.filename}`;
        const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

        const story = await StoryService.createStory(userId, mediaUrl, mediaType);
        res.status(201).json(story);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to create story' });
    }
};

export const getStoryFeed = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const stories = await StoryService.getFriendStories(userId);
        res.json(stories);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to get stories' });
    }
};

export const deleteStory = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { id } = req.params;
        await StoryService.deleteStory(id, userId);
        res.json({ message: 'Story deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Failed to delete story' });
    }
};
