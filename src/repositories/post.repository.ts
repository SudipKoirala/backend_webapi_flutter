import Post, { IPost } from '../models/post.model';

export const createPost = async (postData: Partial<IPost>): Promise<IPost> => {
    const post = new Post(postData);
    return await post.save();
};

export const getPosts = async (filter: any): Promise<IPost[]> => {
    return await Post.find(filter)
        .populate('author', 'username image')
        .sort({ createdAt: -1 });
};

export const getPostById = async (id: string): Promise<IPost | null> => {
    return await Post.findById(id).populate('author', 'username image');
};

export const deletePost = async (id: string, authorId: string): Promise<boolean> => {
    const result = await Post.deleteOne({ _id: id, author: authorId });
    return result.deletedCount > 0;
};
