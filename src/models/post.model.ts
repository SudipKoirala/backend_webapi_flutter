import mongoose, { Schema, Document } from 'mongoose';

export interface IComment {
    _id: mongoose.Types.ObjectId;
    author: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
}

export interface IPost extends Document {
    author: mongoose.Types.ObjectId;
    content: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    visibility: 'public' | 'friends';
    likes: mongoose.Types.ObjectId[];
    comments: IComment[];
    createdAt: Date;
    updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
    {
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

const postSchema: Schema<IPost> = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        mediaUrl: { type: String, required: false },
        mediaType: { type: String, enum: ['image', 'video'], required: false },
        visibility: {
            type: String,
            enum: ['public', 'friends'],
            default: 'friends',
        },
        likes: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
        comments: [commentSchema],
    },
    { timestamps: true }
);

postSchema.index({ author: 1, createdAt: -1 });

export default mongoose.model<IPost>('Post', postSchema);
