import { Request, Response } from 'express';
import * as ChatService from '../services/chat.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const listFriends = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const friends = await ChatService.listFriendPresence(userId);
    res.status(200).json(friends);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to fetch friends' });
  }
};

export const listConversations = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const conversations = await ChatService.listConversations(userId);
    res.status(200).json(conversations);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to fetch conversations' });
  }
};

export const listMessagesWithFriend = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { friendId } = req.params;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const data = await ChatService.listMessagesWithFriend(userId, friendId, limit);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to fetch messages' });
  }
};

export const sendMessageToFriend = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { friendId } = req.params;
    const { content } = req.body;
    const data = await ChatService.sendMessageToFriend(userId, friendId, content);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to send message' });
  }
};
