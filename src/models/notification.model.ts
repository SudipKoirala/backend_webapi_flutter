import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    type: 'post_text' | 'post_image' | 'post_video';
    message: string;
    postId?: mongoose.Types.ObjectId;
    read: boolean;
    hidden: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['post_text', 'post_image', 'post_video'], required: true },
        message: { type: String, required: true },
        postId: { type: Schema.Types.ObjectId, ref: 'Post', required: false },
        read: { type: Boolean, default: false },
        hidden: { type: Boolean, default: false },
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', notificationSchema);
