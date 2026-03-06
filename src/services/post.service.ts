import * as PostRepository from '../repositories/post.repository';
import { IPost } from '../models/post.model';
import Post from '../models/post.model';
import User from '../models/user.model';
import mongoose from 'mongoose';

export const createPost = async (postData: Partial<IPost>) => {
    const post = await Post.create(postData);
    return await Post.findById(post._id)
        .populate('author', '_id username image')
        .populate('comments.author', '_id username image');
};

export const getVisiblePosts = async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const friendIds = user.friends || [];

    const filter = {
        $or: [
            { visibility: 'public' },
            { author: { $in: friendIds }, visibility: 'friends' },
            { author: userId },
        ],
    };

    return await Post.find(filter)
        .populate('author', '_id username image')
        .populate('comments.author', '_id username image')
        .sort({ createdAt: -1 });
};

export const deletePost = async (postId: string, userId: string) => {
    return await PostRepository.deletePost(postId, userId);
};

export const toggleLike = async (postId: string, userId: string) => {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const userObjId = new mongoose.Types.ObjectId(userId);
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
        post.likes = post.likes.filter((id) => id.toString() !== userId) as any;
    } else {
        post.likes.push(userObjId);
    }

    await post.save();

    return {
        liked: !alreadyLiked,
        likesCount: post.likes.length,
    };
};

export const getPostAuthorId = async (postId: string) => {
    const post = await Post.findById(postId).select('author');
    if (!post) throw new Error('Post not found');
    return post.author.toString();
};

export const addComment = async (postId: string, authorId: string, content: string) => {
    const trimmed = content?.trim();
    if (!trimmed) throw new Error('Comment content is required');

    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    post.comments.push({ author: new mongoose.Types.ObjectId(authorId), content: trimmed } as any);
    await post.save();

    const updated = await Post.findById(postId).populate('comments.author', '_id username image');
    const comment = updated?.comments[updated.comments.length - 1];
    return comment ? comment.toObject ? comment.toObject() : comment : null;
};

export const getComments = async (postId: string) => {
    const post = await Post.findById(postId).populate('comments.author', '_id username image');
    if (!post) throw new Error('Post not found');

    return post.comments;
};

