import mongoose from 'mongoose';
import Story from '../models/story.model';
import User from '../models/user.model';

export const createStory = async (
    authorId: string,
    mediaUrl: string,
    mediaType: 'image' | 'video'
) => {
    const story = await Story.create({ author: authorId, mediaUrl, mediaType });
    return await Story.findById(story._id).populate('author', '_id username image');
};

export const getFriendStories = async (userId: string) => {
    const user = await User.findById(userId).select('friends');
    if (!user) throw new Error('User not found');

    const authorIds = [new mongoose.Types.ObjectId(userId), ...user.friends];

    const stories = await Story.find({ author: { $in: authorIds } })
        .populate('author', '_id username image')
        .sort({ createdAt: -1 });

    // Group by author
    const grouped = new Map<string, { author: any; stories: any[] }>();
    for (const story of stories) {
        const author = story.author as any;
        const authorId = author._id.toString();
        if (!grouped.has(authorId)) {
            grouped.set(authorId, { author, stories: [] });
        }
        grouped.get(authorId)!.stories.push({
            _id: story._id,
            mediaUrl: story.mediaUrl,
            mediaType: story.mediaType,
            createdAt: story.createdAt,
            expiresAt: story.expiresAt,
        });
    }

    return Array.from(grouped.values());
};

export const deleteStory = async (storyId: string, userId: string) => {
    const story = await Story.findOne({ _id: storyId, author: userId });
    if (!story) throw new Error('Story not found or unauthorized');
    await story.deleteOne();
    return true;
};
