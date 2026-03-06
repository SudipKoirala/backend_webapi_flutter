import { Request, Response } from 'express';
import * as PostService from '../services/post.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { createLikeNotification, createPostNotifications } from '../services/notification.service';

export const createPost = async (req: Request, res: Response) => {
    try {
        const { content, visibility } = req.body;
        const authorId = (req as AuthRequest).user!.id;

        let mediaUrl: string | undefined;
        let mediaType: 'image' | 'video' | undefined;

        if (req.file) {
            mediaUrl = `/uploads/${req.file.filename}`;
            mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
        }

        const post = await PostService.createPost({
            author: authorId as any,
            content,
            visibility: visibility || 'friends',
            mediaUrl,
            mediaType,
        });
        if (!post) {
            return res.status(500).json({ message: 'Failed to create post' });
        }

        // Fire notifications to friends (non-blocking)
        const notifType = mediaType === 'video' ? 'post_video' : mediaType === 'image' ? 'post_image' : 'post_text';
        createPostNotifications(authorId, post._id.toString(), notifType).catch(() => { });

        res.status(201).json(post);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getFeed = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user!.id;
        const posts = await PostService.getVisiblePosts(userId);
        res.json(posts);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deletePost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthRequest).user!.id;
        const deleted = await PostService.deletePost(id, userId);

        if (!deleted) {
            return res.status(404).json({ message: 'Post not found or unauthorized' });
        }

        res.json({ message: 'Post deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const likePost = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user!.id;
        const { id } = req.params;
        const postAuthorId = await PostService.getPostAuthorId(id);
        const result = await PostService.toggleLike(id, userId);

        if (result.liked && postAuthorId !== userId) {
            createLikeNotification(userId, postAuthorId, id).catch(() => { });
        }

        res.json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Failed to like post' });
    }
};

export const addComment = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user!.id;
        const { id } = req.params;
        const { content } = req.body;
        const comment = await PostService.addComment(id, userId, content);
        res.status(201).json(comment);
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Failed to add comment' });
    }
};

export const getComments = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const comments = await PostService.getComments(id);
        res.json(comments);
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Failed to get comments' });
    }
};
