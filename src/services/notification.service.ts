import Notification from '../models/notification.model';
import User from '../models/user.model';

export const createPostNotifications = async (
    authorId: string,
    postId: string,
    type: 'post_text' | 'post_image' | 'post_video'
) => {
    const author = await User.findById(authorId).select('username friends');
    if (!author || !author.friends.length) return;

    const messageMap = {
        post_text: `${author.username} added a status — check it out!`,
        post_image: `${author.username} shared a photo — check it out!`,
        post_video: `${author.username} shared a video — check it out!`,
    };

    // Find friends who have notifications enabled
    const friends = await User.find({
        _id: { $in: author.friends },
        notificationsEnabled: true,
    }).select('_id');

    if (!friends.length) return;

    const docs = friends.map((f) => ({
        recipient: f._id,
        sender: authorId,
        type,
        message: messageMap[type],
        postId,
        read: false,
        hidden: false,
    }));

    await Notification.insertMany(docs);
};

export const createLikeNotification = async (
    senderId: string,
    recipientId: string,
    postId: string
) => {
    if (senderId === recipientId) return;

    const [recipient, sender] = await Promise.all([
        User.findById(recipientId).select('notificationsEnabled'),
        User.findById(senderId).select('username'),
    ]);

    if (!recipient || recipient.notificationsEnabled === false) return;
    if (!sender) return;

    await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type: 'post_text',
        message: `${sender.username} liked your post`,
        postId,
        read: false,
        hidden: false,
    });
};

export const getNotifications = async (userId: string) => {
    return Notification.find({ recipient: userId, hidden: false })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('sender', 'username image')
        .lean();
};

export const markRead = async (notificationId: string, userId: string) => {
    const n = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { read: true },
        { new: true }
    );
    if (!n) throw new Error('Notification not found');
    return n;
};

export const hideNotification = async (notificationId: string, userId: string) => {
    const n = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { hidden: true },
        { new: true }
    );
    if (!n) throw new Error('Notification not found');
    return n;
};

export const restoreHiddenNotifications = async (userId: string) => {
    await Notification.updateMany({ recipient: userId, hidden: true }, { hidden: false });
    return { restored: true };
};

export const markAllRead = async (userId: string) => {
    await Notification.updateMany({ recipient: userId, read: false }, { read: true });
    return { success: true };
};
