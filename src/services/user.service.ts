import bcrypt from 'bcryptjs';
import * as UserRepo from '../repositories/user.repository';
import { CreateUserDTOType, UpdateUserDTOType } from '../dtos/user.dto';
import fs from 'fs';
import path from 'path';

export const getAllUsers = async (page: number = 1, limit: number = 10) => {
    return await UserRepo.findAllUsers(page, limit);
};

export const getUserById = async (id: string) => {
    const user = await UserRepo.findUserById(id);
    if (!user) throw new Error('User not found');
    return user;
};

export const createUser = async (data: CreateUserDTOType, imagePath?: string) => {
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const userData = {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'user',
        image: imagePath,
    };

    return await UserRepo.createUser(userData);
};

export const updateUser = async (id: string, data: UpdateUserDTOType, imagePath?: string) => {
    const user = await UserRepo.findUserById(id);
    if (!user) throw new Error('User not found');

    const updateData: any = { ...data };

    // Hash password if provided
    if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Update image if provided
    if (imagePath) {
        // Delete old image if exists
        if (user.image) {
            const oldImagePath = path.join(__dirname, '../../uploads', path.basename(user.image));
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
        updateData.image = imagePath;
    }

    return await UserRepo.updateUser(id, updateData);
};

export const deleteUser = async (id: string) => {
    const user = await UserRepo.findUserById(id);
    if (!user) throw new Error('User not found');

    // Delete user image if exists
    if (user.image) {
        const imagePath = path.join(__dirname, '../../uploads', path.basename(user.image));
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    return await UserRepo.deleteUser(id);
};

export const getUserStats = async () => {
    const { users, total } = await UserRepo.findAllUsers(1, 100000); // Get all for stats
    const admins = users.filter(u => u.role === 'admin').length;
    const regularUsers = total - admins;

    // Last 7 days users
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = users.filter(u => new Date((u as any).createdAt) > sevenDaysAgo).length;

    return {
        total,
        admins,
        regularUsers,
        recentUsers,
    };
};

export const toggleNotifications = async (id: string) => {
    const user = await UserRepo.findUserById(id);
    if (!user) throw new Error('User not found');

    return await UserRepo.updateUser(id, { notificationsEnabled: !user.notificationsEnabled });
};

export const toggleFriend = async (userId: string, friendId: string) => {
    const user = await UserRepo.findUserById(userId);
    const friend = await UserRepo.findUserById(friendId);

    if (!user || !friend) throw new Error('User or Friend not found');

    const friendIndex = user.friends.findIndex(id => id.toString() === friendId);

    if (friendIndex > -1) {
        // Remove friend
        user.friends.splice(friendIndex, 1);
        // Also remove from friend's list
        const userInFriendIndex = friend.friends.findIndex(id => id.toString() === userId);
        if (userInFriendIndex > -1) friend.friends.splice(userInFriendIndex, 1);
    } else {
        // Add friend
        user.friends.push(friendId as any);
        friend.friends.push(userId as any);
    }

    await friend.save();
    return await user.save();
};
