import { Request, Response } from 'express';
import { CreateUserDTO, UpdateUserDTO } from '../dtos/user.dto';
import * as UserService from '../services/user.service';

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const data = await UserService.getAllUsers(page, limit);
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to fetch users' });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await UserService.getUserById(id);
        res.status(200).json(user);
    } catch (error: any) {
        res.status(404).json({ message: error.message || 'User not found' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const parsedResult = CreateUserDTO.safeParse(req.body);

        if (!parsedResult.success) {
            const messages = parsedResult.error.issues.map((e) => e.message).join(', ');
            return res.status(400).json({ message: messages });
        }

        const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;
        const user = await UserService.createUser(parsedResult.data, imagePath);

        res.status(201).json({ message: 'User created successfully', user });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Failed to create user' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const parsedResult = UpdateUserDTO.safeParse(req.body);

        if (!parsedResult.success) {
            const messages = parsedResult.error.issues.map((e) => e.message).join(', ');
            return res.status(400).json({ message: messages });
        }

        const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;
        const user = await UserService.updateUser(id, parsedResult.data, imagePath);

        res.status(200).json({ message: 'User updated successfully', user });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Failed to update user' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await UserService.deleteUser(id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Failed to delete user' });
    }
};

export const getUserStats = async (req: Request, res: Response) => {
    try {
        const stats = await UserService.getUserStats();
        res.status(200).json(stats);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to fetch stats' });
    }
};

export const toggleNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const user = await UserService.toggleNotifications(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({
            message: 'Notification settings updated',
            notificationsEnabled: user.notificationsEnabled
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Failed to toggle notifications' });
    }
};

export const toggleFriend = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { friendId } = req.params;

        if (userId === friendId) {
            return res.status(400).json({ message: 'You cannot friend yourself' });
        }

        const user = await UserService.toggleFriend(userId, friendId);
        res.status(200).json({
            message: 'Friend status updated',
            friendsCount: user.friends.length
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Failed to toggle friend' });
    }
};
