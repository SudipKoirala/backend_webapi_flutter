import mongoose from 'mongoose';
import User from '../models/user.model';

export const searchUsers = async (query: string, requesterId: string) => {
    if (!query || query.trim().length === 0) return [];

    const users = await User.find({
        username: { $regex: query.trim(), $options: 'i' },
        _id: { $ne: new mongoose.Types.ObjectId(requesterId) },
    })
        .select('_id username email image isOnline lastSeenAt friends')
        .limit(20);

    return users.map((u) => ({
        _id: u._id,
        username: u.username,
        email: u.email,
        image: u.image,
        isOnline: u.isOnline,
        isFriend: u.friends.some((id) => id.toString() === requesterId),
    }));
};

export const getPublicProfile = async (targetId: string, requesterId: string) => {
    const user = await User.findById(targetId).select(
        '_id username email image isOnline lastSeenAt friends createdAt'
    );
    if (!user) throw new Error('User not found');

    // Count posts
    const Post = require('../models/post.model').default;
    const postCount = await Post.countDocuments({ author: targetId });

    return {
        _id: user._id,
        username: user.username,
        email: user.email,
        image: user.image,
        isOnline: user.isOnline,
        lastSeenAt: user.lastSeenAt || null,
        friendsCount: user.friends.length,
        postCount,
        isFriend: user.friends.some((id) => id.toString() === requesterId),
    };
};

export const toggleFriend = async (userId: string, friendId: string) => {
    if (userId === friendId) throw new Error('You cannot friend yourself');

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
    if (!user || !friend) throw new Error('User or friend not found');

    const friendObjId = new mongoose.Types.ObjectId(friendId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    const isAlreadyFriend = user.friends.some((id) => id.toString() === friendId);

    if (isAlreadyFriend) {
        user.friends = user.friends.filter((id) => id.toString() !== friendId) as any;
        friend.friends = friend.friends.filter((id) => id.toString() !== userId) as any;
    } else {
        user.friends.push(friendObjId);
        friend.friends.push(userObjId);
    }

    await friend.save();
    await user.save();

    return {
        isFriend: !isAlreadyFriend,
        friendsCount: user.friends.length,
    };
};

export const listMyFriends = async (userId: string) => {
    const user = await User.findById(userId).select('friends');
    if (!user) throw new Error('User not found');

    return await User.find({ _id: { $in: user.friends } })
        .select('_id username email image isOnline lastSeenAt')
        .sort({ username: 1 });
};

export const toggleNotifications = async (userId: string) => {
    const user = await User.findById(userId).select('notificationsEnabled');
    if (!user) throw new Error('User not found');

    user.notificationsEnabled = !user.notificationsEnabled;
    await user.save();

    return { notificationsEnabled: user.notificationsEnabled };
};
