import mongoose, { Schema, Document } from 'mongoose';

export interface IStory extends Document {
    author: mongoose.Types.ObjectId;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    createdAt: Date;
    expiresAt: Date;
}

const storySchema = new Schema<IStory>(
    {
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        mediaUrl: { type: String, required: true },
        mediaType: { type: String, enum: ['image', 'video'], required: true },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            index: { expires: 0 }, // TTL index – Mongo auto-deletes expired docs
        },
    },
    { timestamps: true }
);

storySchema.index({ author: 1, createdAt: -1 });

export default mongoose.model<IStory>('Story', storySchema);
